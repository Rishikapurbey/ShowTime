import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

const Harness = ({ initial = '' }) => {
  const [term, setTerm] = useState(initial);
  return <SearchBar searchTerm={term} setSearchTerm={setTerm} />;
};

const input = () => screen.getByRole('textbox', { name: 'Search for movies, TV shows' });

describe('SearchBar', () => {
  it('only shows the clear button when there is something to clear', async () => {
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    await userEvent.type(input(), 'batman');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('clears the search and keeps focus in the box', async () => {
    render(<Harness initial="batman" />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input()).toHaveValue('');
    expect(input()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('clears the search when Escape is pressed', async () => {
    render(<Harness initial="batman" />);
    await userEvent.type(input(), '{Escape}');
    expect(input()).toHaveValue('');
  });
});
