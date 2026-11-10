import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithAuth } from '../test/renderWithAuth';
import Header from './Header';

describe('Header', () => {
  it('shows the logo as plain text, not a link', () => {
    renderWithAuth(<Header />, { route: '/watchlist' });
    expect(screen.getByRole('heading', { name: 'ShowTime' }).closest('a')).toBeNull();
    expect(screen.queryByRole('link', { name: 'ShowTime' })).not.toBeInTheDocument();
  });
});
