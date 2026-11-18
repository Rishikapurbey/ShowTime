import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMovies } from '../api/omdb';
import MovieList from './MovieList';
import './CategoryRow.css';

// `fallbackYear` keeps a yearly row filled early in a new year, before OMDb has any results.
const CategoryRow = ({ title, searchTerm, year, fallbackYear }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['category', searchTerm, year, fallbackYear],
    queryFn: async () => {
      const result = await searchMovies(searchTerm, { year });
      return result.movies.length === 0 && fallbackYear
        ? searchMovies(searchTerm, { year: fallbackYear })
        : result;
    },
  });

  if (isError || (data && data.movies.length === 0)) return null;

  return (
    <div className="category-row">
      <h2>{title}</h2>
      <MovieList movies={data?.movies ?? []} isLoading={isLoading} />
    </div>
  );
};

export default CategoryRow;
