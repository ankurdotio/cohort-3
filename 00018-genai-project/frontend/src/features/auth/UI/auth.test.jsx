import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../../app/routes.jsx';
import authReducer, { sessionCleared, sessionReceived } from '../State/auth.slice.js';
import { authApi } from '../Hooks/session.js';

vi.mock('../Hooks/session.js', () => ({
  initializeSession: vi.fn(),
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() },
}));

const session = {
  accessToken: 'memory-only-token',
  user: { id: 'one', name: 'Alex Morgan', email: 'alex@example.com', createdAt: '2026-01-02T00:00:00.000Z' },
};

function setup(path = '/login', authenticated = false) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(authenticated ? sessionReceived(session) : sessionCleared());
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<Provider store={store}><RouterProvider router={router} /></Provider>);
  return { user: userEvent.setup(), store };
}

beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('authentication UI', () => {
  it('redirects protected pages to login and supports password visibility', async () => {
    const { user } = setup('/account');
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('validates registration before making a request, then signs in without browser token storage', async () => {
    const { user, store } = setup('/register');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please check');
    expect(authApi.register).not.toHaveBeenCalled();
    authApi.register.mockResolvedValue(session);
    await user.type(screen.getByLabelText('Your name'), 'Alex Morgan');
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'thoughtful1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('heading', { name: "You're home, Alex." })).toBeVisible();
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Alex Morgan', email: 'alex@example.com', password: 'thoughtful1',
    });
    expect(store.getState().auth.accessToken).toBe(session.accessToken);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('shows server field errors and re-enables submission after failure', async () => {
    const { user } = setup('/register');
    authApi.register.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: {
        success: false, message: 'Account already exists',
        errors: [{ field: 'email', message: 'Try another email address' }],
      } },
    });
    await user.type(screen.getByLabelText('Your name'), 'Alex Morgan');
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'thoughtful1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Account already exists');
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Try another email address')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });

  it('keeps the session visible when logout fails and clears it only when confirmed', async () => {
    const { user, store } = setup('/account', true);
    authApi.logout.mockRejectedValueOnce({ isAxiosError: true });
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Check your connection');
    expect(store.getState().auth.status).toBe('authenticated');
    authApi.logout.mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    expect(store.getState().auth.accessToken).toBeNull();
  });

  it('refreshes the protected profile and redirects authenticated users away from login', async () => {
    const { user } = setup('/login', true);
    authApi.me.mockResolvedValue({ ...session.user, name: 'Jordan Thinker' });
    await user.click(screen.getByRole('button', { name: 'Refresh account details' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: "You're home, Jordan." })).toBeVisible());
    expect(screen.getByRole('status')).toHaveTextContent('up to date');
  });
});
