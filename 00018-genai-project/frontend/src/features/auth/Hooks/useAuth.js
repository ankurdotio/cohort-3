import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authApi, initializeSession } from './session.js';
import { getApiError } from '../API/auth.api.js';
import { sessionCleared, profileReceived } from '../State/auth.slice.js';

export function useAuth() {
  return { ...useSelector((state) => state.auth), retrySession: initializeSession };
}

export function useAccount() {
  const auth = useAuth();
  const dispatch = useDispatch();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  async function logout() {
    if (pending) return;
    setPending('logout');
    setError(null);
    setNotice(null);
    try {
      await authApi.logout();
      dispatch(sessionCleared());
    } catch (error) {
      if (error.response?.status === 401) dispatch(sessionCleared());
      else setError(getApiError(error).message);
    } finally {
      setPending(null);
    }
  }

  async function reloadProfile() {
    if (pending) return;
    setPending('profile');
    setError(null);
    setNotice(null);
    try {
      dispatch(profileReceived(await authApi.me()));
      setNotice('Your account details are up to date.');
    } catch (error) {
      setError(getApiError(error).message);
    } finally {
      setPending(null);
    }
  }

  return { ...auth, pending, error, notice, logout, reloadProfile };
}
