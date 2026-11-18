import axios from 'axios';

export function getApiError(error) {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    if (body?.success === false && typeof body.message === 'string') {
      return { message: body.message, fields: Array.isArray(body.errors) ? body.errors : [] };
    }
    if (!error.response) {
      return { message: 'We could not reach Downbot. Check your connection and try again.', fields: [] };
    }
    return { message: 'Downbot is temporarily unavailable. Please try again.', fields: [] };
  }
  console.error('Unexpected authentication error:', error);
  return { message: 'Something went wrong. Please try again.', fields: [] };
}

export function createAuthApi({ getAccessToken, onSession, onExpired }) {
  const options = { baseURL: '/api/v1/auth', withCredentials: true, timeout: 15000 };
  const client = axios.create(options);
  const protectedClient = axios.create(options);
  let refreshPromise = null;

  const refresh = () => {
    if (!refreshPromise) {
      refreshPromise = client.post('/refresh')
        .then(({ data }) => {
          onSession(data.data);
          return data.data;
        })
        .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  };

  protectedClient.interceptors.request.use((config) => {
    const accessToken = getAccessToken();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  protectedClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const request = error.config;
      if (error.response?.status !== 401 || !request || request._authRetry) throw error;
      request._authRetry = true;
      try {
        const currentToken = getAccessToken();
        if (!currentToken || request.headers.Authorization === `Bearer ${currentToken}`) {
          await refresh();
        }
        return await protectedClient(request);
      } catch (refreshError) {
        if (refreshError.response?.status === 401) {
          onExpired('Your session has expired. Please sign in again.');
        }
        throw refreshError;
      }
    },
  );

  return {
    async register(values) {
      return (await client.post('/register', values)).data.data;
    },
    async login(values) {
      return (await client.post('/login', values)).data.data;
    },
    refresh,
    async logout() {
      // Finish any rotation before revoking its cookie, avoiding a resurrected session.
      if (refreshPromise) await refreshPromise;
      await client.post('/logout');
    },
    async me() {
      return (await protectedClient.get('/me')).data.data.user;
    },
    client,
    protectedClient,
  };
}
