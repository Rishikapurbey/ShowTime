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
});
