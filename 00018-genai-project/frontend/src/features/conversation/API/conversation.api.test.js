import { describe, expect, it, vi } from 'vitest';
import { createConversationApi } from './conversation.api.js';

function streamOf(...parts) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      parts.forEach((part) => controller.enqueue(encoder.encode(part)));
      controller.close();
    },
  });
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('conversation API', () => {
  it('parses SSE events split across network chunks', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(streamOf(
      'data: {"conversationId":"c1","title":"Hi"}\n\ndata: {"chu',
      'nk":"Hel"}\n\ndata: {"chunk":[{"type":"text","text":"lo"}]}\n\n',
    ), { status: 200 }));
    const api = createConversationApi({ getAccessToken: () => 't', refresh: vi.fn(), onExpired: vi.fn(), fetchImpl });
    const onConversation = vi.fn();
    const tokens = [];
    await api.send({ content: 'hey', conversationId: null, onConversation, onToken: (t) => tokens.push(t) });
    expect(onConversation).toHaveBeenCalledWith({ id: 'c1', title: 'Hi' });
    expect(tokens).toEqual(['Hel', 'lo']);
    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ content: 'hey' });
    expect(init.headers.Authorization).toBe('Bearer t');
  });

  it('refreshes once on 401, retries with the new token, and normalizes ids', async () => {
    let token = 'old';
    const refresh = vi.fn(async () => { token = 'new'; });
    const fetchImpl = vi.fn(async (_url, init) => (init.headers.Authorization === 'Bearer new'
      ? json(200, { data: { conversations: [{ _id: 'c1', title: 'First', createdAt: '2026-01-01' }] } })
      : json(401, { success: false, message: 'Invalid or expired token' })));
    const api = createConversationApi({ getAccessToken: () => token, refresh, onExpired: vi.fn(), fetchImpl });
    expect(await api.list()).toEqual([{ id: 'c1', title: 'First', createdAt: '2026-01-01' }]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('expires the session when refresh is rejected and surfaces server error messages', async () => {
    const onExpired = vi.fn();
    const refresh = vi.fn().mockRejectedValue({ response: { status: 401 } });
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(404, { success: false, message: 'Conversation not found' }));
    const api = createConversationApi({ getAccessToken: () => 't', refresh, onExpired, fetchImpl });
    await expect(api.list()).rejects.toThrow('session has expired');
    expect(onExpired).toHaveBeenCalled();
    await expect(api.messages('x')).rejects.toThrow('Conversation not found');
  });
});
