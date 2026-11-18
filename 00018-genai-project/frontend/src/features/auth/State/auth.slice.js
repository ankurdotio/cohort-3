import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  status: 'checking',
  sessionError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionReceived(state, { payload }) {
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.status = 'authenticated';
      state.sessionError = null;
    },
    sessionCleared(state, { payload }) {
      state.user = null;
      state.accessToken = null;
      state.status = 'anonymous';
      state.sessionError = payload || null;
    },
    sessionFailed(state, { payload }) {
      state.status = 'error';
      state.sessionError = payload;
    },
    sessionChecking(state) {
      state.status = 'checking';
      state.sessionError = null;
    },
    profileReceived(state, { payload }) {
      state.user = payload;
    },
  },
});

export const {
  sessionReceived, sessionCleared, sessionFailed, sessionChecking, profileReceived,
} = authSlice.actions;
export default authSlice.reducer;
