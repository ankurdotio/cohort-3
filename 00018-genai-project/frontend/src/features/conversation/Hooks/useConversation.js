import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { conversationApi } from './client.js';
import { getConversationError } from '../API/conversation.api.js';
import {
  NEW_CONVERSATION_KEY, aiMessageCompleted, aiMessageFailed, aiTokenReceived, conversationStarted,
  conversationsLoaded, messagesLoaded, selectCanSend, selectCurrentConversationId, selectCurrentMessages,
  userMessageSent,
} from '../State/conversation.slice.js';

let listRequest = null;
const messageRequests = new Map();
let activeStream = null;

const currentUserId = (getState) => getState().auth.user?.id ?? null;

export const loadConversations = () => (dispatch, getState) => {
  if (!listRequest) {
    const userId = currentUserId(getState);
    listRequest = conversationApi.list()
      // Drop late responses that belong to a session that has since signed out.
      .then((list) => { if (currentUserId(getState) === userId) dispatch(conversationsLoaded(list)); })
      .finally(() => { listRequest = null; });
  }
  return listRequest;
};

export const loadMessages = (conversationId) => (dispatch, getState) => {
  if (!messageRequests.has(conversationId)) {
    const userId = currentUserId(getState);
    messageRequests.set(conversationId, conversationApi.messages(conversationId)
      .then((messages) => {
        if (currentUserId(getState) === userId) dispatch(messagesLoaded({ conversationId, messages }));
      })
      .finally(() => messageRequests.delete(conversationId)));
  }
  return messageRequests.get(conversationId);
};

export const sendMessage = (content) => async (dispatch, getState) => {
  const text = content.trim();
  if (!text || !selectCanSend(getState())) return false;
  const conversationId = getState().conversation.currentConversation;
  const controller = new AbortController();
  activeStream = controller;
  const live = () => !controller.signal.aborted;
  dispatch(userMessageSent({ conversationId: conversationId ?? NEW_CONVERSATION_KEY, content: text }));
  try {
    await conversationApi.send({
      content: text,
      conversationId,
      signal: controller.signal,
      onConversation: (conversation) => { if (live()) dispatch(conversationStarted(conversation)); },
      onToken: (token) => { if (live()) dispatch(aiTokenReceived(token)); },
    });
    if (live()) dispatch(aiMessageCompleted());
  } catch (error) {
    if (live()) dispatch(aiMessageFailed(getConversationError(error)));
  } finally {
    if (activeStream === controller) activeStream = null;
  }
  return true;
};

export function cancelActiveStream() {
  activeStream?.abort();
  activeStream = null;
}

export function useConversationListLoader() {
  const dispatch = useDispatch();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    dispatch(loadConversations())
      .then(() => { if (active) setStatus('ready'); })
      .catch((failure) => {
        if (!active) return;
        setStatus('error');
        setError(getConversationError(failure));
      });
    return () => { active = false; };
  }, [dispatch, attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  return { status, error, retry };
}

/** Subscribes only to the active conversation's messages, fetching them on first view. */
export function useCurrentMessages() {
  const dispatch = useDispatch();
  const conversationId = useSelector(selectCurrentConversationId);
  const messages = useSelector(selectCurrentMessages);
  const [failure, setFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const needsFetch = conversationId !== null && messages === undefined;

  useEffect(() => {
    if (!needsFetch) return undefined;
    let active = true;
    dispatch(loadMessages(conversationId)).catch((error) => {
      if (active) setFailure({ conversationId, message: getConversationError(error) });
    });
    return () => { active = false; };
  }, [dispatch, conversationId, needsFetch, attempt]);

  const error = needsFetch && failure?.conversationId === conversationId ? failure.message : null;
  return {
    messages: messages ?? [],
    loading: needsFetch && !error,
    error,
    retry: () => {
      setFailure(null);
      setAttempt((value) => value + 1);
    },
  };
}
