import { store } from '../../../app/store.js';
import { createAuthApi, getApiError } from '../API/auth.api.js';
import { sessionReceived, sessionCleared, sessionChecking, sessionFailed } from '../State/auth.slice.js';

export const authApi = createAuthApi({
  getAccessToken: () => store.getState().auth.accessToken,
  onSession: (session) => store.dispatch(sessionReceived(session)),
  onExpired: (message) => store.dispatch(sessionCleared(message)),
});

let initialization;

export function initializeSession() {
  if (initialization) return initialization;
  store.dispatch(sessionChecking());
  initialization = authApi.refresh()
    .catch((error) => {
      // No valid cookie is the expected signed-out state, not a server outage.
      if (error.response?.status === 401) store.dispatch(sessionCleared());
      else store.dispatch(sessionFailed(getApiError(error).message));
    })
    .finally(() => { initialization = null; });
  return initialization;
}
