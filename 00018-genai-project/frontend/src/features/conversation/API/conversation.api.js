const BASE_URL = '/api/v1/conversation';

export class ConversationApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ConversationApiError';
    this.status = status;
  }
}

export function getConversationError(error) {
  if (error instanceof ConversationApiError) return error.message;
  if (error instanceof TypeError) return 'We could not reach Downbot. Check your connection and try again.';
  console.error('Unexpected conversation error:', error);
  return 'Something went wrong. Please try again.';
}

async function toApiError(response) {
  let body = null;
  try { body = await response.json(); } catch { /* Non-JSON error bodies fall back to a generic message. */ }
  if (body?.success === false && typeof body.message === 'string') {
    return new ConversationApiError(body.message, response.status);
  }
  return new ConversationApiError('Downbot is temporarily unavailable. Please try again.', response.status);
}

export function normalizeConversation(conversation) {
  return {
    id: String(conversation.id ?? conversation._id),
    title: conversation.title || 'New conversation',
    createdAt: conversation.createdAt ?? null,
  };
}

export function normalizeMessage(message) {
  return {
    id: String(message.id ?? message._id),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt ?? null,
  };
}

// LangChain chunks are usually strings but can be arrays of content parts.
export function chunkText(chunk) {
  if (typeof chunk === 'string') return chunk;
  if (Array.isArray(chunk)) return chunk.map((part) => (typeof part === 'string' ? part : part?.text ?? '')).join('');
  return '';
}

/** Reads a text/event-stream body and yields each JSON `data:` payload. */
export async function* readServerSentEvents(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const parse = (block) => {
    const data = block.split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    return data ? JSON.parse(data) : null;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = done ? '' : blocks.pop();
      for (const block of blocks) {
        const event = parse(block);
        if (event) yield event;
      }
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}

export function createConversationApi({ getAccessToken, refresh, onExpired, fetchImpl = (...args) => fetch(...args) }) {
  async function request(path, init = {}, retried = false) {
    const token = getAccessToken();
    const headers = { Accept: 'application/json', ...init.headers };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchImpl(`${BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
    if (response.status !== 401 || retried) {
      if (!response.ok) throw await toApiError(response);
      return response;
    }
    try {
      // Another request may already have rotated the token; only refresh if ours is still current.
      if (!getAccessToken() || getAccessToken() === token) await refresh();
    } catch (error) {
      if (error.response?.status === 401) {
        onExpired('Your session has expired. Please sign in again.');
        throw new ConversationApiError('Your session has expired. Please sign in again.', 401);
      }
      throw error;
    }
    return request(path, init, true);
  }

  return {
    async list() {
      const { data } = await (await request('/')).json();
      return data.conversations.map(normalizeConversation);
    },
    async messages(conversationId) {
      const { data } = await (await request(`/messages/${encodeURIComponent(conversationId)}`)).json();
      return data.messages
        .map(normalizeMessage)
        .filter((message) => message.role === 'user' || message.role === 'assistant');
    },
    /**
     * Streams an AI reply. Calls `onConversation` once with `{ id, title }`, then `onToken` per chunk.
     */
    async send({ content, conversationId, signal, onConversation, onToken }) {
      const body = { content };
      if (conversationId) body.conversation = conversationId;
      const response = await request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(body),
        signal,
      });
      for await (const event of readServerSentEvents(response.body)) {
        if (event.conversationId) onConversation({ id: String(event.conversationId), title: event.title || 'New conversation' });
        else if ('chunk' in event) {
          const text = chunkText(event.chunk);
          if (text) onToken(text);
        }
      }
    },
  };
}
