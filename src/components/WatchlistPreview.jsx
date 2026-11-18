import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './WatchlistPreview.css';

const FEATURES = [
  { title: 'Save for later', text: 'Press + on any movie or series to add it to your list.', icon: 'M12 5v14M5 12h14' },
  { title: "Mark what you've seen", text: 'Keep what you want to watch apart from what you already have.', icon: 'm5 12.5 4.5 4.5L19 7' },
  { title: 'Rate with stars', text: "Give everything you've watched 1 to 5 stars.", icon: 'm12 4 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z' },
  { title: 'See your stats', text: 'Find your average rating and the decades you watch most.', icon: 'M6 20v-6M12 20V5M18 20v-9' },
  { title: 'Share your list', text: 'Get a public link that friends can open.', icon: 'M10 14a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7L12 7M14 10a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.7 5.7L12 17' },
];

// What signed-out visitors see at /watchlist.
const WatchlistPreview = () => {
  const { pathname } = useLocation();
  const authState = { from: pathname };

  return (
    <section className="watchlist-preview">
      <p className="watchlist-preview-eyebrow">Your watchlist</p>
      <h1>Never lose track of what to watch</h1>
      <p className="watchlist-preview-intro">
        Sign in and ShowTime keeps every movie and series you care about in one place.
      </p>

      <div className="watchlist-preview-actions">
        <Link to="/login" state={authState} className="cta-button">Log in</Link>
        <Link to="/signup" state={authState} className="cta-button secondary">Create account</Link>
      </div>

      <ul className="watchlist-preview-features">
        {FEATURES.map(({ title, text, icon }) => (
          <li key={title}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icon} /></svg>
            <h2>{title}</h2>
            <p>{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default WatchlistPreview;
