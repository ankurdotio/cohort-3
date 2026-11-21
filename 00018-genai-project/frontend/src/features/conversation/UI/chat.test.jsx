import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../../app/routes.jsx';
import authReducer, { sessionCleared, sessionReceived } from '../../auth/State/auth.slice.js';
import conversationReducer from '../State/conversation.slice.js';
import { conversationApi } from '../Hooks/client.js';

vi.mock('../../auth/Hooks/session.js', () => ({
  initializeSession: vi.fn(),
  authApi: { logout: vi.fn() },
}));
vi.mock('../Hooks/client.js', () => ({
  conversationApi: { list: vi.fn(), messages: vi.fn(), send: vi.fn() },
}));

function setup() {
  const store = configureStore({ reducer: { auth: authReducer, conversation: conversationReducer } });
  store.dispatch(sessionReceived({ accessToken: 't', user: { id: 'u1', name: 'Alex Morgan', email: 'a@b.co' } }));
  render(<Provider store={store}><RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/chat'] })} /></Provider>);
  return { user: userEvent.setup(), store };
}

// Lets the test drive the SSE stream event by event.
function controllableSend() {
  const stream = {};
  conversationApi.send.mockImplementation((args) => new Promise((resolve) => Object.assign(stream, args, { finish: resolve })));
  return stream;
}

beforeEach(() => {
  conversationApi.list.mockResolvedValue([
    { id: 'c1', title: 'Older chat', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'c2', title: 'Newest chat', createdAt: '2026-02-01T00:00:00Z' },
  ]);
});

describe('chat page', () => {
  it('lists conversations newest first and lazily loads messages for the selected one', async () => {
    const { user, store } = setup();
    const list = await screen.findByRole('list', { name: 'Conversations' });
    expect(within(list).getAllByRole('button').map((b) => b.textContent)).toEqual(['Newest chat', 'Older chat']);
    conversationApi.messages.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'Hello there' },
      { id: 'm2', role: 'assistant', content: 'Hi! How can I help?' },
    ]);
    await user.click(screen.getByRole('button', { name: 'Older chat' }));
    expect(await screen.findByText('Hi! How can I help?')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Older chat');
    expect(screen.getByRole('button', { name: 'Older chat' })).toHaveAttribute('aria-current', 'page');
    expect(conversationApi.messages).toHaveBeenCalledWith('c1');
    expect(store.getState().conversation.messages.c1).toHaveLength(2);
  });

  it('streams a new conversation into aiLatestMessage, then commits it to messages', async () => {
    const { user, store } = setup();
    await screen.findByRole('list', { name: 'Conversations' });
    const stream = controllableSend();
    await user.type(screen.getByLabelText('Message Downbot'), 'Explain SSE{Enter}');
    expect(screen.getByText('Explain SSE')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('thinking');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(stream.conversationId).toBeNull();

    act(() => {
      stream.onConversation({ id: 'c3', title: 'Server-sent events' });
      stream.onToken('Server ');
      stream.onToken('push.');
    });
    let state = store.getState().conversation;
    expect(state.currentConversation).toBe('c3');
    expect(state.aiLatestMessage).toMatchObject({ conversationId: 'c3', content: 'Server push.', status: 'streaming' });
    expect(state.messages.c3).toEqual([expect.objectContaining({ role: 'user', content: 'Explain SSE' })]);
    expect(screen.getByRole('button', { name: 'Server-sent events' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Server push.')).toBeVisible();

    await act(async () => stream.finish());
    state = store.getState().conversation;
    expect(state.aiLatestMessage).toBeNull();
    expect(state.messages.c3.map((m) => [m.role, m.content])).toEqual([['user', 'Explain SSE'], ['assistant', 'Server push.']]);
    expect(screen.getByText('Server push.')).toBeVisible();
  });

  it('renders AI replies as GitHub-flavored Markdown, including tables', async () => {
    const { user } = setup();
    conversationApi.messages.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'Compare **them**' },
      { id: 'm2', role: 'assistant', content: 'Here is **bold** text.\n\n| Model | Speed |\n| --- | --- |\n| Fast | High |\n\n<script>alert(1)</script>' },
    ]);
    await user.click(await screen.findByRole('button', { name: 'Older chat' }));
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Model', 'Speed']);
    expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['Fast', 'High']);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('Compare **them**')).toBeVisible();
    expect(document.querySelector('script')).toBeNull();
  });

  it('shows stream failures in place and clears all conversation state on sign out', async () => {
    const { user, store } = setup();
    await screen.findByRole('list', { name: 'Conversations' });
    conversationApi.send.mockRejectedValue(new TypeError('Failed to fetch'));
    await user.type(screen.getByLabelText('Message Downbot'), 'Hi{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('could not reach Downbot');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    await user.type(screen.getByLabelText('Message Downbot'), 'Again');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();

    act(() => { store.dispatch(sessionCleared()); });
    expect(store.getState().conversation).toEqual({
      conversation: [], currentConversation: null, messages: {}, aiLatestMessage: null,
    });
  });
});
