import React from 'react';
import { useAuth } from '../context/auth-context';
import MovieList from '../components/MovieList';
import WatchedControls from '../components/WatchedControls';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import './WatchlistPage.css';

const TABS = [
  { key: 'towatch', label: 'To watch', empty: 'Nothing left to watch. Add some movies!' },
  { key: 'watched', label: 'Watched', empty: "You haven't marked anything as watched yet." },
];

const renderWatchedControls = (movie) => <WatchedControls movie={movie} compact />;

const WatchlistPage = () => {
  const { watchlist, currentUser, authLoading } = useAuth();
  const location = useLocation();
  // The tab lives in the URL (?tab=watched) so Back and refresh keep it.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.find((t) => t.key === searchParams.get('tab')) || TABS[0];

  if (authLoading) {
    return (
      <div className="watchlist-page">
        <p className="status-message">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="watchlist-page">
        <div className="watchlist-message">
          <h1>Please Login</h1>
          <p>You need to be logged in to see your watchlist.</p>
          <Link to="/login" state={{ from: location.pathname }} className="login-button">Login</Link>
        </div>
      </div>
    );
  }

  const byTab = {
    towatch: watchlist.filter((m) => !m.watched),
    watched: watchlist.filter((m) => m.watched),
  };
  const movies = byTab[activeTab.key];

  return (
    <div className="watchlist-page">
      <h1>My Watchlist{watchlist.length > 0 && <span className="watchlist-count"> · {watchlist.length}</span>}</h1>

      {watchlist.length > 0 ? (
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
            <MovieList movies={movies} layout="grid" renderActions={renderWatchedControls} />
          ) : (
            <p className="watchlist-message">{activeTab.empty}</p>
          )}
        </>
      ) : (
        <p className="watchlist-message">Your watchlist is empty. Add some movies!</p>
      )}
    </div>
  );
};

export default WatchlistPage;
