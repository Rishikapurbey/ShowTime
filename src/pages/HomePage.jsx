import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMovies } from '../api/omdb';
import useDebounce from '../hooks/useDebounce';
import SearchBar from '../components/SearchBar';
import MovieList from '../components/MovieList';
import CategoryRow from '../components/CategoryRow';
import './HomePage.css';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const query = useDebounce(searchTerm.trim(), 500);

  const { data: searchResults = [], isFetching, isError, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchMovies(query),
    enabled: query !== '',
  });

  const isSearching = searchTerm.trim() !== '';

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
          <h2 className="search-results-title">Search Results for "{searchTerm}"</h2>
          {isError ? (
            <p className="status-message error">{error.message}</p>
          ) : isFetching || query !== searchTerm.trim() ? (
            <p className="status-message">Searching...</p>
          ) : searchResults.length === 0 ? (
            <p className="status-message">No movies found.</p>
          ) : (
            <MovieList movies={searchResults} />
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
