import { describe, expect, it, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { createAuthApi, getApiError } from './auth.api.js';

function setup() {
  let token = 'expired';
  const onSession = vi.fn((session) => { token = session.accessToken; });
  const onExpired = vi.fn();
  const api = createAuthApi({ getAccessToken: () => token, onSession, onExpired });
  return {
    api, onSession, onExpired,
    raw: new MockAdapter(api.client),
    protectedMock: new MockAdapter(api.protectedClient),
  };
}

describe('session-aware API', () => {
  it('coalesces concurrent 401 responses into one refresh and retries with the new token', async () => {
    const { api, raw, protectedMock, onSession } = setup();
    const user = { id: 'one', name: 'Alex' };
    protectedMock.onGet('/me').reply((config) => (
      config.headers.Authorization === 'Bearer renewed'
        ? [200, { data: { user } }] : [401, {}]
    ));
    raw.onPost('/refresh').reply(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return [200, { data: { user, accessToken: 'renewed' } }];
    });
    expect(await Promise.all([api.me(), api.me()])).toEqual([user, user]);
    expect(raw.history.post).toHaveLength(1);
    expect(onSession).toHaveBeenCalledTimes(1);
  });

  it('expires the local session on refresh rejection without an infinite retry loop', async () => {
    const { api, raw, protectedMock, onExpired } = setup();
    protectedMock.onGet('/me').reply(401);
    raw.onPost('/refresh').reply(401, { success: false, message: 'Session expired', errors: [] });
    await expect(api.me()).rejects.toMatchObject({ response: { status: 401 } });
    expect(onExpired).toHaveBeenCalledOnce();
    expect(raw.history.post).toHaveLength(1);
    expect(protectedMock.history.get).toHaveLength(1);
  });

  it('does not silently sign out on a temporary network outage', async () => {
    const { api, raw, protectedMock, onExpired } = setup();
    protectedMock.onGet('/me').reply(401);
    raw.onPost('/refresh').networkError();
    const error = await api.me().catch((error) => error);
    expect(getApiError(error).message).toContain('Check your connection');
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('stops after one retry when a renewed access token is also rejected', async () => {
    const { api, raw, protectedMock, onExpired } = setup();
    protectedMock.onGet('/me').reply(401);
    raw.onPost('/refresh').reply(200, { data: { accessToken: 'renewed' } });
    await expect(api.me()).rejects.toMatchObject({ response: { status: 401 } });
    expect(raw.history.post).toHaveLength(1);
    expect(protectedMock.history.get).toHaveLength(2);
    expect(onExpired).toHaveBeenCalledOnce();
  });

  it('waits for pending rotation before sending logout', async () => {
    const { api, raw } = setup();
    const order = [];
    raw.onPost('/refresh').reply(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push('refresh');
      return [200, { data: { accessToken: 'renewed' } }];
    });
    raw.onPost('/logout').reply(() => {
      order.push('logout');
      return [200, { data: {} }];
    });
    await Promise.all([api.refresh(), api.logout()]);
    expect(order).toEqual(['refresh', 'logout']);
  });

  it('surfaces HTML/proxy failures without pretending the session is absent', async () => {
    const { api, raw } = setup();
    raw.onPost('/login').reply(502, '<html>Bad gateway</html>');
    const error = await api.login({}).catch((error) => error);
    expect(getApiError(error)).toEqual({
      message: 'Downbot is temporarily unavailable. Please try again.', fields: [],
    });
  });
});
