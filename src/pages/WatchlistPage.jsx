import React from 'react';
import { useAuth } from '../context/auth-context';
import MovieList from '../components/MovieList';
import WatchedControls from '../components/WatchedControls';
import SharePanel from '../components/SharePanel';
import StatsPanel from '../components/StatsPanel';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import './WatchlistPage.css';

const TABS = [
  { key: 'towatch', label: 'To watch', empty: 'Nothing left to watch. Add some movies!' },
  { key: 'watched', label: 'Watched', empty: "You haven't marked anything as watched yet." },
  { key: 'stats', label: 'Stats' },
];

// The watchlist arrives newest-first from Firestore, so "added" sorts need no comparator.
// "Year" uses the first year, so series like "2010–2014" sort by when they started.
const year = (m) => parseInt(m.Year, 10) || 0;
const SORTS = [
  { key: 'added', label: 'Recently added' },
  { key: 'oldest', label: 'Oldest added' },
  { key: 'title', label: 'Title (A–Z)', compare: (a, b) => a.Title.localeCompare(b.Title) },
  { key: 'year', label: 'Release year (newest)', compare: (a, b) => year(b) - year(a) },
  // Unrated movies go last.
  { key: 'rating', label: 'Your rating (highest)', compare: (a, b) => (b.rating || 0) - (a.rating || 0), watchedOnly: true },
];

const RATING_FILTERS = [
  { key: '', label: 'All ratings', test: () => true },
  { key: '5', label: '★★★★★ only', test: (m) => m.rating === 5 },
  { key: '4', label: '★★★★ & up', test: (m) => m.rating >= 4 },
  { key: '3', label: '★★★ & up', test: (m) => m.rating >= 3 },
  { key: 'unrated', label: 'Not rated yet', test: (m) => !m.rating },
];

const renderWatchedControls = (movie) => <WatchedControls movie={movie} compact />;

const WatchlistPage = () => {
  const { watchlist, currentUser, authLoading } = useAuth();
  const location = useLocation();

  // Tab, sort, rating filter and title search live in the URL so Back and refresh keep them.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.find((t) => t.key === searchParams.get('tab')) || TABS[0];
  const onWatchedTab = activeTab.key === 'watched';
  const sort =
    SORTS.find((s) => s.key === searchParams.get('sort') && (onWatchedTab || !s.watchedOnly)) || SORTS[0];
  const ratingFilter = (onWatchedTab && RATING_FILTERS.find((f) => f.key === searchParams.get('rating'))) || RATING_FILTERS[0];
  const titleQuery = searchParams.get('q') || '';

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

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
    stats: [],
  };
  const onStatsTab = activeTab.key === 'stats';

  const query = titleQuery.trim().toLowerCase();
  let movies = byTab[activeTab.key].filter(
    (m) => ratingFilter.test(m) && (!query || m.Title.toLowerCase().includes(query))
  );
  if (sort.key === 'oldest') movies = [...movies].reverse();
  else if (sort.compare) movies = [...movies].sort(sort.compare);

  const isFiltered = Boolean(query) || ratingFilter !== RATING_FILTERS[0];
  const clearFilters = () => updateParams({ q: '', rating: '' });

  return (
    <div className="watchlist-page">
      <h1>My Watchlist{watchlist.length > 0 && <span className="watchlist-count"> · {watchlist.length}</span>}</h1>
      <SharePanel />

      {watchlist.length > 0 ? (
        <>
          <div className="watchlist-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={tab === activeTab}
                className={`watchlist-tab ${tab === activeTab ? 'active' : ''}`}
                // The rating filter only exists on the Watched tab, so drop it when switching.
                onClick={() => updateParams({ tab: tab === TABS[0] ? '' : tab.key, rating: '' })}
              >
                {tab.label}
                {tab.key !== 'stats' && <span className="tab-count"> {byTab[tab.key].length}</span>}
              </button>
            ))}
          </div>

          {onStatsTab && <StatsPanel watchlist={watchlist} />}

          {!onStatsTab && byTab[activeTab.key].length > 0 && (
            <div className="watchlist-toolbar">
              <input
                type="search"
                className="watchlist-search"
                placeholder="Search your list..."
                aria-label="Search your watchlist by title"
                value={titleQuery}
                onChange={(e) => updateParams({ q: e.target.value })}
              />

              <label className="watchlist-select">
                <span>Sort</span>
                <select value={sort.key} onChange={(e) => updateParams({ sort: e.target.value === SORTS[0].key ? '' : e.target.value })}>
                  {SORTS.filter((s) => onWatchedTab || !s.watchedOnly).map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </label>

              {onWatchedTab && (
                <label className="watchlist-select">
                  <span>Rating</span>
                  <select value={ratingFilter.key} onChange={(e) => updateParams({ rating: e.target.value })}>
                    {RATING_FILTERS.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {onStatsTab ? null : movies.length > 0 ? (
            <MovieList movies={movies} layout="grid" renderActions={renderWatchedControls} />
          ) : isFiltered ? (
            <div className="watchlist-message">
              <p>No movies match these filters.</p>
              <button className="clear-filters" onClick={clearFilters}>Clear filters</button>
            </div>
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
