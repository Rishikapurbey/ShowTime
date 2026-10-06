import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useShareProfile, { UsernameTaken } from '../hooks/useShareProfile';
import { normalizeUsername, usernameError, shareUrl } from '../lib/share';
import './SharePanel.css';

// Picks (or changes) the name in the share link.
const UsernameForm = ({ initial = '', submitLabel, onSubmit, onCancel }) => {
  const [name, setName] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = normalizeUsername(name);
    const problem = usernameError(username);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit(username);
    } catch (err) {
      setError(err instanceof UsernameTaken ? 'That name is taken. Try another.' : 'Something went wrong. Please try again.');
      if (!(err instanceof UsernameTaken)) console.error('Could not save share link:', err);
      setSaving(false);
    }
  };

  return (
    <form className="share-form" onSubmit={handleSubmit} noValidate>
      <label className="share-name-field">
        <span className="share-prefix">/u/</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your_name"
          aria-label="Name for your share link"
          aria-invalid={Boolean(error)}
          aria-describedby="share-name-help"
          autoComplete="off"
          spellCheck="false"
          maxLength={20}
        />
      </label>
      <button type="submit" className="share-button primary" disabled={saving}>
        {saving ? 'Saving...' : submitLabel}
      </button>
      {onCancel && (
        <button type="button" className="share-button" onClick={onCancel}>
          Cancel
        </button>
      )}
      <p id="share-name-help" className={error ? 'share-error' : 'share-hint'} role={error ? 'alert' : undefined}>
        {error || '3–20 letters, numbers or underscores.'}
      </p>
    </form>
  );
};

const SharePanel = () => {
  const { profile, claimUsername, setPublic } = useShareProfile();
  const [renaming, setRenaming] = useState(false);
  const [copied, setCopied] = useState(false);

  if (profile === undefined) return null;

  if (profile === null) {
    return (
      <section className="share-panel" aria-labelledby="share-title">
        <h2 id="share-title">Share your watchlist</h2>
        <p>Pick a name for your public link. Anyone with the link can see your lists and ratings.</p>
        <UsernameForm submitLabel="Create link" onSubmit={claimUsername} />
      </section>
    );
  }

  const url = shareUrl(profile.username);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link is still on screen to copy by hand.
    }
  };

  return (
    <section className="share-panel" aria-labelledby="share-title">
      <div className="share-header">
        <h2 id="share-title">Share your watchlist</h2>
        <label className="share-switch">
          <input
            type="checkbox"
            role="switch"
            checked={profile.public}
            onChange={(e) =>
              setPublic(e.target.checked).catch((error) => console.error('Could not change sharing:', error))
            }
          />
          <span className="share-switch-track" aria-hidden="true" />
          <span>{profile.public ? 'Public' : 'Private'}</span>
        </label>
      </div>

      {renaming ? (
        <UsernameForm
          initial={profile.username}
          submitLabel="Save"
          onSubmit={async (username) => {
            await claimUsername(username);
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      ) : profile.public ? (
        <>
          <p>Anyone with this link can see your lists and ratings:</p>
          <div className="share-link-row">
            <Link to={`/u/${profile.username}`} className="share-link">{url}</Link>
            <button className="share-button primary" onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</button>
            <button className="share-button" onClick={() => setRenaming(true)}>Change name</button>
          </div>
          <p className="share-hint">Changing the name stops the old link from working.</p>
        </>
      ) : (
        <p>
          Your watchlist is private, so <strong>/u/{profile.username}</strong> shows nothing. Switch to
          Public to share it again.
        </p>
      )}
    </section>
  );
};

export default SharePanel;
