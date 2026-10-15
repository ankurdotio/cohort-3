import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi.js';

function getErrorDetails(error) {
  return {
    message: error.message,
    errors: error.errors ?? [],
    status: error.status ?? 0,
  };
}

export const initializeSession = createAsyncThunk('auth/initialize', async (_, { rejectWithValue }) => {
  try {
    return await authApi.refresh();
  } catch (error) {
    if (error.status === 401) {
      return null;
    }

    return rejectWithValue(getErrorDetails(error));
  }
}, {
  condition: (_, { getState }) => {
    const status = getState().auth.bootstrap;
    return status === 'idle' || status === 'failed';
  },
});

export const signIn = createAsyncThunk('auth/signIn', async (input, { rejectWithValue }) => {
  try {
    return await authApi.login(input);
  } catch (error) {
    return rejectWithValue(getErrorDetails(error));
  }
});

export const signUp = createAsyncThunk('auth/signUp', async (input, { rejectWithValue }) => {
  try {
    return await authApi.register(input);
  } catch (error) {
    return rejectWithValue(getErrorDetails(error));
  }
});

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    await authApi.logout();
  } catch (error) {
    return rejectWithValue(getErrorDetails(error));
  }
});

export const loadProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    return await authApi.getProfile();
  } catch (error) {
    return rejectWithValue(getErrorDetails(error));
  }
});

const initialState = {
  user: null,
  accessToken: null,
  bootstrap: 'idle',
  pending: false,
  error: null,
};

function startLoading(state) {
  state.pending = true;
  state.error = null;
}

function saveSession(state, action) {
  state.user = action.payload?.user ?? null;
  state.accessToken = action.payload?.accessToken ?? null;
  state.pending = false;
}

function saveError(state, action) {
  state.pending = false;
  state.error = action.payload ?? getErrorDetails(action.error);
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    sessionReceived(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    sessionExpired(state) {
      state.user = null;
      state.accessToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSession.pending, (state) => {
        state.bootstrap = 'loading';
        state.error = null;
      })
      .addCase(initializeSession.fulfilled, (state, action) => {
        state.bootstrap = 'ready';
        saveSession(state, action);
      })
      .addCase(initializeSession.rejected, (state, action) => {
        state.bootstrap = 'failed';
        saveError(state, action);
      })
      .addCase(signIn.pending, startLoading)
      .addCase(signIn.fulfilled, saveSession)
      .addCase(signIn.rejected, saveError)
      .addCase(signUp.pending, startLoading)
      .addCase(signUp.fulfilled, saveSession)
      .addCase(signUp.rejected, saveError)
      .addCase(signOut.pending, startLoading)
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.pending = false;
      })
      .addCase(signOut.rejected, saveError)
      .addCase(loadProfile.pending, startLoading)
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.pending = false;
      })
      .addCase(loadProfile.rejected, saveError);
  },
});

export const { clearError, sessionReceived, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
