import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth } from '../test/renderWithAuth';
import SharePanel from './SharePanel';

// Fake Firestore for the real useShareProfile hook: records batches and pushes profile snapshots.
const fs = vi.hoisted(() => ({}));

vi.mock('../lib/firebase', () => ({
  loadFirestore: vi.fn(async () => fs.sdk),
}));

const makeFakeFirestore = () => {
  fs.names = {};
  fs.batches = [];
  fs.sdk = {
    db: {},
    doc: (db, ...path) => path.join('/'),
    onSnapshot: vi.fn((path, next) => {
      fs.emitProfile = (profile) =>
        act(() => next({ exists: () => Boolean(profile), data: () => profile }));
      return vi.fn();
    }),
    getDoc: vi.fn(async (path) => {
      const data = fs.names[path];
      return { exists: () => Boolean(data), data: () => data };
    }),
    writeBatch: () => {
      const ops = [];
      return {
        set: (path, data) => ops.push(['set', path, data]),
        delete: (path) => ops.push(['delete', path]),
        commit: vi.fn(async () => {
          if (fs.commitError) throw fs.commitError;
          fs.batches.push(ops);
        }),
      };
    },
    updateDoc: vi.fn().mockResolvedValue(),
  };
};

const renderPanel = async (profile) => {
  renderWithAuth(<SharePanel />);
  await waitFor(() => expect(fs.sdk.onSnapshot).toHaveBeenCalled());
  await fs.emitProfile(profile);
};

const nameInput = () => screen.getByRole('textbox', { name: 'Name for your share link' });

describe('SharePanel', () => {
  beforeEach(() => {
    fs.commitError = null;
    makeFakeFirestore();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue() },
      configurable: true,
    });
  });

  it('shows nothing until the share settings have loaded', () => {
    const { container } = renderWithAuth(<SharePanel />);
    expect(container).toBeEmptyDOMElement();
  });

  describe('creating a link', () => {
    it('claims the name and makes the watchlist public in one write', async () => {
      await renderPanel(null);
      await userEvent.type(nameInput(), '  Movie_Fan ');
      await userEvent.click(screen.getByRole('button', { name: 'Create link' }));

      await waitFor(() => expect(fs.batches).toHaveLength(1));
      expect(fs.batches[0]).toEqual([
        ['set', 'usernames/movie_fan', { uid: 'user-1' }],
        ['set', 'profiles/user-1', { username: 'movie_fan', public: true }],
      ]);
    });

    it('explains an invalid name without saving', async () => {
      await renderPanel(null);
      await userEvent.type(nameInput(), 'no spaces');
      await userEvent.click(screen.getByRole('button', { name: 'Create link' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Use only letters, numbers and underscores.');
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
      expect(fs.batches).toHaveLength(0);
    });

    it("says when a name is someone else's", async () => {
      fs.names['usernames/taken'] = { uid: 'someone-else' };
      await renderPanel(null);
      await userEvent.type(nameInput(), 'taken');
      await userEvent.click(screen.getByRole('button', { name: 'Create link' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('That name is taken.');
      expect(fs.batches).toHaveLength(0);
    });

    it('says a name is taken when someone claims it first (rules refuse the write)', async () => {
      fs.commitError = Object.assign(new Error('denied'), { code: 'permission-denied' });
      await renderPanel(null);
      await userEvent.type(nameInput(), 'racy');
      await userEvent.click(screen.getByRole('button', { name: 'Create link' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('That name is taken.');
      // The button is usable again for another try.
      expect(screen.getByRole('button', { name: 'Create link' })).toBeEnabled();
    });
  });

  describe('with a link', () => {
    const shared = { username: 'movie_fan', public: true };

    it('shows the link and copies it', async () => {
      await renderPanel(shared);
      const url = `${window.location.origin}/u/movie_fan`;
      expect(screen.getByRole('link', { name: url })).toHaveAttribute('href', '/u/movie_fan');

      await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url);
      expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    });

    it('switches sharing off and on', async () => {
      await renderPanel(shared);
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeChecked();

      await userEvent.click(toggle);
      expect(fs.sdk.updateDoc).toHaveBeenCalledWith('profiles/user-1', { public: false });

      await fs.emitProfile({ ...shared, public: false });
      expect(screen.getByRole('switch')).not.toBeChecked();
      expect(screen.getByText(/Your watchlist is private/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Copy link' })).not.toBeInTheDocument();
    });

    it('renames by releasing the old name in the same write, keeping sharing as it was', async () => {
      await renderPanel(shared);
      await userEvent.click(screen.getByRole('button', { name: 'Change name' }));
      expect(nameInput()).toHaveValue('movie_fan');

      await userEvent.clear(nameInput());
      await userEvent.type(nameInput(), 'film_buff');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(fs.batches).toHaveLength(1));
      expect(fs.batches[0]).toEqual([
        ['delete', 'usernames/movie_fan'],
        ['set', 'usernames/film_buff', { uid: 'user-1' }],
        ['set', 'profiles/user-1', { username: 'film_buff', public: true }],
      ]);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('does nothing when "renamed" to the same name', async () => {
      await renderPanel(shared);
      await userEvent.click(screen.getByRole('button', { name: 'Change name' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(fs.batches).toHaveLength(0);
      expect(fs.sdk.getDoc).not.toHaveBeenCalled();
    });

    it('can cancel a rename', async () => {
      await renderPanel(shared);
      await userEvent.click(screen.getByRole('button', { name: 'Change name' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    });
  });
});
