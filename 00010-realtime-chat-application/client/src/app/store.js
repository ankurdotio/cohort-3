import { configureStore } from '@reduxjs/toolkit';
import authReducer, { sessionReceived, sessionExpired } from '../features/auth/authSlice.js';
import { setupApiInterceptors } from '../api/apiClient.js';

export const store = configureStore({ reducer: { auth: authReducer } });

setupApiInterceptors({
  getAccessToken: () => store.getState().auth.accessToken,
  onSessionReceived: (session) => store.dispatch(sessionReceived(session)),
  onSessionExpired: () => store.dispatch(sessionExpired()),
});
