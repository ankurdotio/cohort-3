import { store } from '../../../app/store.js';
import { authApi } from '../../auth/Hooks/session.js';
import { sessionCleared } from '../../auth/State/auth.slice.js';
import { createConversationApi } from '../API/conversation.api.js';

export const conversationApi = createConversationApi({
  getAccessToken: () => store.getState().auth.accessToken,
  refresh: () => authApi.refresh(),
  onExpired: (message) => store.dispatch(sessionCleared(message)),
});
