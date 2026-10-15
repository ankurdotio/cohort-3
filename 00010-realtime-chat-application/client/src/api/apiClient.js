import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

class ApiError extends Error {
  constructor(message, status = 0, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const sessionEndpoints = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
];

function normalizeError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const status = error.response?.status ?? 0;
  const body = error.response?.data;
  if (body?.success === false && typeof body.message === 'string' && Array.isArray(body.errors)) {
    return new ApiError(body.message, status, body.errors);
  }
  if (error.response) {
    return new ApiError('The server returned an unreadable response. Please try again.', status);
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError('The request timed out. Please try again.');
  }
  if (axios.isCancel(error)) {
    return new ApiError('The request was cancelled.');
  }

  return new ApiError('Cannot connect to the server. Check your connection and try again.');
}

export function setupApiInterceptors({ getAccessToken, onSessionReceived, onSessionExpired }) {
  let refreshPromise;

  function refreshSession() {
    if (!refreshPromise) {
      refreshPromise = api.post('/auth/refresh')
        .then(onSessionReceived)
        .finally(() => {
          refreshPromise = undefined;
        });
    }

    return refreshPromise;
  }

  api.interceptors.request.use((config) => {
    if (sessionEndpoints.includes(config.url)) {
      return config;
    }

    const token = getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.delete('Authorization');
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => {
      const body = response.data;
      if (body?.success === true && Object.hasOwn(body, 'data')) {
        return body.data;
      }

      throw normalizeError({ response });
    },
    async (error) => {
      const request = error.config;
      const isUnauthorized = error.response?.status === 401;

      if (!isUnauthorized || !request || sessionEndpoints.includes(request.url)) {
        throw normalizeError(error);
      }
      if (request._retry) {
        onSessionExpired();
        throw normalizeError(error);
      }
      request._retry = true;

      // A delayed 401 may arrive after another request has already rotated the token.
      const currentToken = getAccessToken();
      const sentToken = request.headers.get('Authorization');
      if (currentToken && sentToken !== `Bearer ${currentToken}`) {
        return api(request);
      }

      try {
        await refreshSession();
      } catch (refreshError) {
        if (refreshError.status === 401) {
          onSessionExpired();
        }

        throw normalizeError(refreshError);
      }

      return api(request);
    },
  );
}
