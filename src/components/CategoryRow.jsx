import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieList from './MovieList';
import './CategoryRow.css';


const CategoryRow = ({ title, searchTerm, year }) => {
  const [movies, setMovies] = useState([]);
  const API_KEY = '595c2e8f';

  useEffect(() => {
    const fetchMoviesByCategory = async () => {
      try {
        
        let apiUrl = `http://www.omdbapi.com/?s=${searchTerm}&apikey=${API_KEY}`;
        
        
        if (year) {
          apiUrl += `&y=${year}`;
        }

        const response = await axios.get(apiUrl);
        if (response.data.Search) {
          setMovies(response.data.Search);
        }
      } catch (error) {
        console.error(`Error fetching movies for ${title}:`, error);
      }
    };

    fetchMoviesByCategory();
  }, [searchTerm, title, year]); 

  return (
    <div className="category-row">
      <h2>{title}</h2>
      <MovieList movies={movies} />
    </div>
  );
};

export default CategoryRow;