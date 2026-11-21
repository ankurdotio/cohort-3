import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/State/auth.slice.js';
import conversationReducer from '../features/conversation/State/conversation.slice.js';

export const store = configureStore({
  reducer: { auth: authReducer, conversation: conversationReducer },
  // Access tokens are intentionally kept out of browser storage and production devtools.
  devTools: import.meta.env.DEV,
});
