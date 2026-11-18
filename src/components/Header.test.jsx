import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithAuth } from '../test/renderWithAuth';
import Header from './Header';

describe('Header', () => {
  it('shows the logo as plain text, not a link or a heading', () => {
    renderWithAuth(<Header />, { route: '/watchlist' });
    expect(screen.getByText('ShowTime').closest('a')).toBeNull();
    expect(screen.queryByRole('link', { name: 'ShowTime' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'ShowTime' })).not.toBeInTheDocument();
  });

  it('shows signed-out visitors the Watchlist link next to Login', () => {
    renderWithAuth(<Header />, { auth: { currentUser: null } });
    expect(screen.getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist');
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('holds the links back until sign-in status is known', () => {
    renderWithAuth(<Header />, { auth: { currentUser: null, authLoading: true } });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
