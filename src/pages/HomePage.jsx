import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchMovies, RESULTS_PER_PAGE } from '../api/omdb';
import useDebounce from '../hooks/useDebounce';
import SearchBar from '../components/SearchBar';
import MovieList from '../components/MovieList';
import CategoryRow from '../components/CategoryRow';
import './HomePage.css';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const query = useDebounce(searchTerm.trim(), 500);

  const { data, isFetching, isFetchingNextPage, isError, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['search', query],
    queryFn: ({ pageParam }) => searchMovies(query, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length * RESULTS_PER_PAGE < lastPage.totalResults ? allPages.length + 1 : undefined,
    enabled: query !== '',
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
  const isWaiting = query !== searchTerm.trim() || (isFetching && !isFetchingNextPage);

  return (
    <div className="homepage-content">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {!isSearching ? (
        <>
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
          <h2 className="search-results-title">
            Search Results for "{searchTerm}"
            {!isWaiting && totalResults > 0 && (
              <span className="search-results-count"> · {totalResults.toLocaleString()} found</span>
            )}
          </h2>
          {isError ? (
            <p className="status-message error">Search failed. Please try again.</p>
          ) : isWaiting ? (
            <MovieList movies={[]} isLoading layout="grid" />
          ) : searchResults.length === 0 ? (
            <p className="status-message">No movies found.</p>
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
