import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactPage from './ContactPage';

describe('ContactPage', () => {
  it('offers email only', () => {
    const { container } = render(<MemoryRouter><ContactPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Email/ })).toBeInTheDocument();
    expect(container.querySelector('a[href^="mailto:"]')).toBeInTheDocument();
    expect(container.querySelector('a[href^="tel:"]')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Phone/ })).not.toBeInTheDocument();
  });
});
