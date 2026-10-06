import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth } from '../test/renderWithAuth';
import LoginPage from './LoginPage';

const authError = (code) => Object.assign(new Error(code), { code });

const renderLogin = (auth, options) =>
  renderWithAuth(<LoginPage />, { route: '/login', path: '/login', auth: { currentUser: null, ...auth }, ...options });

const fillIn = async (email, password) => {
  await userEvent.type(screen.getByPlaceholderText('Email'), email);
  await userEvent.type(screen.getByPlaceholderText('Password'), password);
};

describe('LoginPage', () => {
  it('logs in and goes back to the page that sent the user here', async () => {
    const login = vi.fn().mockResolvedValue();
    const { location } = renderLogin({ login }, { routerState: { from: '/watchlist' } });

    await fillIn('me@example.com', 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(login).toHaveBeenCalledWith('me@example.com', 'secret123');
    expect(location.current.pathname).toBe('/watchlist');
  });

  it('goes home after logging in when nothing sent the user here', async () => {
    const { location } = renderLogin();
    await fillIn('me@example.com', 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(location.current.pathname).toBe('/');
  });

  it('shows a readable message when the password is wrong', async () => {
    const { location } = renderLogin({ login: vi.fn().mockRejectedValue(authError('auth/invalid-credential')) });
    await fillIn('me@example.com', 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
    expect(location.current.pathname).toBe('/login');
  });

  it('explains that accounts are off when Firebase is not configured', async () => {
    renderLogin({ login: vi.fn().mockRejectedValue(authError('app/not-configured')) });
    await fillIn('me@example.com', 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Accounts aren't available right now.");
  });

  it('shows nothing when the Google popup is closed', async () => {
    renderLogin({ loginWithGoogle: vi.fn().mockRejectedValue(authError('auth/popup-closed-by-user')) });
    await userEvent.click(screen.getByRole('button', { name: /Google/ }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('asks for an email before sending a password reset', async () => {
    const resetPassword = vi.fn();
    renderLogin({ resetPassword });
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email above');
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('sends a password reset link', async () => {
    const resetPassword = vi.fn().mockResolvedValue();
    renderLogin({ resetPassword });
    await userEvent.type(screen.getByPlaceholderText('Email'), 'me@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));

    expect(resetPassword).toHaveBeenCalledWith('me@example.com');
    expect(await screen.findByRole('status')).toHaveTextContent('a password reset link is on its way');
  });
});
