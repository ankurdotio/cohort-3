import { createSlice, nanoid } from '@reduxjs/toolkit';
import { sessionCleared } from '../../auth/State/auth.slice.js';

// Messages for a conversation the server has not created yet live under this key.
export const NEW_CONVERSATION_KEY = '__new__';

const initialState = {
  conversation: [],
  currentConversation: null,
  messages: {},
  // { conversationId, content, status: 'pending' | 'streaming' | 'error', error }
  aiLatestMessage: null,
};

const byNewest = (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    conversationsLoaded(state, { payload }) {
      const known = new Set(payload.map(({ id }) => id));
      // Keep conversations created locally while the list request was in flight.
      const local = state.conversation.filter(({ id }) => !known.has(id));
      state.conversation = [...local, ...[...payload].sort(byNewest)];
    },
    conversationSelected(state, { payload }) {
      state.currentConversation = payload;
      if (state.aiLatestMessage?.status === 'error') state.aiLatestMessage = null;
    },
    newConversationOpened(state) {
      state.currentConversation = null;
      if (state.aiLatestMessage?.conversationId !== NEW_CONVERSATION_KEY) {
        delete state.messages[NEW_CONVERSATION_KEY];
      }
      if (state.aiLatestMessage?.status === 'error') state.aiLatestMessage = null;
    },
    messagesLoaded(state, { payload: { conversationId, messages } }) {
      if (!state.messages[conversationId]) state.messages[conversationId] = messages;
    },
    userMessageSent: {
      reducer(state, { payload: { conversationId, message } }) {
        (state.messages[conversationId] ??= []).push(message);
        state.aiLatestMessage = { conversationId, content: '', status: 'pending', error: null };
      },
      prepare: ({ conversationId, content }) => ({
        payload: {
          conversationId,
          message: { id: nanoid(), role: 'user', content, createdAt: new Date().toISOString() },
        },
      }),
    },
    conversationStarted(state, { payload: { id, title } }) {
      if (!state.conversation.some((item) => item.id === id)) {
        state.conversation.unshift({ id, title, createdAt: new Date().toISOString() });
      }
      if (state.messages[NEW_CONVERSATION_KEY]) {
        state.messages[id] = [...(state.messages[id] ?? []), ...state.messages[NEW_CONVERSATION_KEY]];
        delete state.messages[NEW_CONVERSATION_KEY];
      }
      if (state.aiLatestMessage?.conversationId === NEW_CONVERSATION_KEY) state.aiLatestMessage.conversationId = id;
      if (state.currentConversation === null) state.currentConversation = id;
    },
    aiTokenReceived(state, { payload }) {
      if (!state.aiLatestMessage) return;
      state.aiLatestMessage.content += payload;
      state.aiLatestMessage.status = 'streaming';
    },
    aiMessageCompleted(state) {
      const latest = state.aiLatestMessage;
      if (!latest) return;
      if (latest.content) {
        (state.messages[latest.conversationId] ??= []).push({
          id: nanoid(), role: 'assistant', content: latest.content, createdAt: new Date().toISOString(),
        });
      }
      state.aiLatestMessage = null;
    },
    aiMessageFailed(state, { payload }) {
      if (!state.aiLatestMessage) return;
      state.aiLatestMessage.status = 'error';
      state.aiLatestMessage.error = payload;
    },
  },
  extraReducers: (builder) => {
    // Never leak one account's conversations into the next session.
    builder.addCase(sessionCleared, () => initialState);
  },
});

export const {
  conversationsLoaded, conversationSelected, newConversationOpened, messagesLoaded,
  userMessageSent, conversationStarted, aiTokenReceived, aiMessageCompleted, aiMessageFailed,
} = conversationSlice.actions;
export default conversationSlice.reducer;

// Narrow selectors: each returns a primitive or a reference that only changes when its own data does.
export const selectConversationList = (state) => state.conversation.conversation;
export const selectCurrentConversationId = (state) => state.conversation.currentConversation;
export const selectCurrentKey = (state) => state.conversation.currentConversation ?? NEW_CONVERSATION_KEY;
export const selectIsCurrent = (id) => (state) => state.conversation.currentConversation === id;
export const selectCurrentMessages = (state) => state.conversation.messages[selectCurrentKey(state)];
export const selectCurrentTitle = (state) => {
  const id = state.conversation.currentConversation;
  return id ? state.conversation.conversation.find((item) => item.id === id)?.title ?? 'Conversation' : 'New conversation';
};
export const selectCurrentAiMessage = (state) => {
  const latest = state.conversation.aiLatestMessage;
  return latest && latest.conversationId === selectCurrentKey(state) ? latest : null;
};
export const selectHasCurrentAiMessage = (state) => selectCurrentAiMessage(state) !== null;
export const selectIsStreaming = (state) => {
  const status = state.conversation.aiLatestMessage?.status;
  return status === 'pending' || status === 'streaming';
};
export const selectCanSend = (state) => !selectIsStreaming(state)
  && (state.conversation.currentConversation === null || selectCurrentMessages(state) !== undefined);
