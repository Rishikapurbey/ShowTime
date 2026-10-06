import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchMovies, RESULTS_PER_PAGE } from '../api/omdb';
import useDebounce from '../hooks/useDebounce';
import SearchBar from '../components/SearchBar';
import MovieList from '../components/MovieList';
import CategoryRow from '../components/CategoryRow';
import HeroBanner from '../components/HeroBanner';
import RecentlyViewedRow from '../components/RecentlyViewedRow';
import './HomePage.css';

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
];

const HomePage = () => {
  // The search lives in the URL (?q=batman&type=movie) so Back and shared links keep it.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? '';

  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const debouncedTerm = useDebounce(searchTerm.trim(), 500);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  // Typing → URL (debounced, replacing history so each keystroke isn't a Back step).
  useEffect(() => {
    if (debouncedTerm !== urlQuery) updateParams({ q: debouncedTerm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  // URL → input, e.g. clicking the logo or pressing Back.
  useEffect(() => {
    if (urlQuery !== debouncedTerm) setSearchTerm(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  const { data, isFetching, isFetchingNextPage, isError, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['search', urlQuery, type],
    queryFn: ({ pageParam }) => searchMovies(urlQuery, { type: type || undefined, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length * RESULTS_PER_PAGE < lastPage.totalResults ? allPages.length + 1 : undefined,
    enabled: urlQuery !== '',
  });

  // OMDb sometimes repeats a movie across pages; keep the first occurrence.
  const searchResults = [];
  const seen = new Set();
  for (const movie of data?.pages.flatMap((page) => page.movies) ?? []) {
    if (!seen.has(movie.imdbID)) {
      seen.add(movie.imdbID);
      searchResults.push(movie);
    }
  }
  const totalResults = data?.pages[0]?.totalResults ?? 0;

  const isSearching = searchTerm.trim() !== '';
  const isWaiting = urlQuery !== searchTerm.trim() || (isFetching && !isFetchingNextPage);

  return (
    <div className="homepage-content">
      {!isSearching && <HeroBanner />}

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {!isSearching ? (
        <>
          <RecentlyViewedRow />
          <CategoryRow title="Latest Movies" searchTerm="movie" year="2025" />
          <CategoryRow title="Hollywood Action" searchTerm="action" />
          <CategoryRow title="Romantic Comedies" searchTerm="romantic comedy" />
          <CategoryRow title="Thrillers" searchTerm="thriller" />
          <CategoryRow title="Comedies" searchTerm="comedy" />
          <CategoryRow title="Family Movies" searchTerm="family" />
          <CategoryRow title="Crowd Pleasers" searchTerm="avengers" />
          <CategoryRow title="Animated Movies" searchTerm="animation" />
        </>
      ) : (
        <>
          <div className="search-results-header">
            <h2 className="search-results-title">
              Search Results for "{searchTerm.trim()}"
              {!isWaiting && totalResults > 0 && (
                <span className="search-results-count"> · {totalResults.toLocaleString()} found</span>
              )}
            </h2>
            <div className="type-filters" role="group" aria-label="Filter by type">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  className={`type-filter ${type === filter.value ? 'active' : ''}`}
                  aria-pressed={type === filter.value}
                  onClick={() => updateParams({ type: filter.value })}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          {isError ? (
            <p className="status-message error">Search failed. Please try again.</p>
          ) : isWaiting ? (
            <MovieList movies={[]} isLoading layout="grid" />
          ) : searchResults.length === 0 ? (
            <p className="status-message">No results found.</p>
          ) : (
            <>
              <MovieList movies={searchResults} layout="grid" />
              {hasNextPage && (
                <div className="load-more">
                  <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
