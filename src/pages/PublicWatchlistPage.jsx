import React, { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicWatchlist, WatchlistNotShared } from '../api/publicWatchlist';
import { useAuth } from '../context/auth-context';
import MovieList from '../components/MovieList';
import './WatchlistPage.css';

const TABS = [
  { key: 'towatch', label: 'To watch', empty: 'Nothing on the To watch list yet.' },
  { key: 'watched', label: 'Watched', empty: 'Nothing marked as watched yet.' },
];

// Read-only version of the owner's star rating.
const renderRating = (movie) =>
  movie.rating ? (
    <p className="public-rating" aria-label={`Rated ${movie.rating} out of 5`}>
      {'★'.repeat(movie.rating)}
      <span className="public-rating-empty">{'★'.repeat(5 - movie.rating)}</span>
    </p>
  ) : null;

const PublicWatchlistPage = () => {
  const { username } = useParams();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.find((t) => t.key === searchParams.get('tab')) || TABS[0];

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-watchlist', username],
    queryFn: () => fetchPublicWatchlist(username),
    // Someone opening a link wants the current list, and "not shared" won't fix itself on retry.
    staleTime: 0,
    retry: (count, err) => !(err instanceof WatchlistNotShared) && count < 1,
  });

  useEffect(() => {
    document.title = `@${username}'s watchlist · ShowTime`;
    return () => {
      document.title = 'ShowTime';
    };
  }, [username]);

  if (isLoading) {
    return (
      <div className="watchlist-page">
        <h1>@{username}'s Watchlist</h1>
        <MovieList movies={[]} isLoading layout="grid" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="watchlist-page">
        <div className="watchlist-message">
          <h1>Watchlist not available</h1>
          <p>
            {error instanceof WatchlistNotShared
              ? "This watchlist is private or doesn't exist."
              : "Couldn't load this watchlist. Please try again."}
          </p>
          <Link to="/" className="login-button">Browse movies</Link>
        </div>
      </div>
    );
  }

  const byTab = {
    towatch: data.movies.filter((m) => !m.watched),
    watched: data.movies.filter((m) => m.watched),
  };
  const movies = byTab[activeTab.key];
  const isOwner = currentUser?.uid === data.uid;

  return (
    <div className="watchlist-page">
      <h1>
        @{username}'s Watchlist
        {data.movies.length > 0 && <span className="watchlist-count"> · {data.movies.length}</span>}
      </h1>

      {isOwner && (
        <p className="public-owner-note">
          This is how others see your watchlist. <Link to="/watchlist">Back to editing</Link>
        </p>
      )}

      {data.movies.length === 0 ? (
        <p className="watchlist-message">This watchlist is empty.</p>
      ) : (
        <>
          <div className="watchlist-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={tab === activeTab}
                className={`watchlist-tab ${tab === activeTab ? 'active' : ''}`}
                onClick={() => setSearchParams(tab === TABS[0] ? {} : { tab: tab.key }, { replace: true })}
              >
                {tab.label} <span className="tab-count">{byTab[tab.key].length}</span>
              </button>
            ))}
          </div>
          {movies.length > 0 ? (
            <MovieList movies={movies} layout="grid" renderActions={renderRating} />
          ) : (
            <p className="watchlist-message">{activeTab.empty}</p>
          )}
        </>
      )}
    </div>
  );
};

export default PublicWatchlistPage;
