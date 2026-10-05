import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMovies } from '../api/omdb';
import MovieList from './MovieList';
import './CategoryRow.css';

const CategoryRow = ({ title, searchTerm, year }) => {
  const { data: movies = [], isError } = useQuery({
    queryKey: ['category', searchTerm, year],
    queryFn: () => searchMovies(searchTerm, { year }),
  });

  if (isError) return null;

  return (
    <div className="category-row">
      <h2>{title}</h2>
      <MovieList movies={movies} />
    </div>
  );
};

export default CategoryRow;
