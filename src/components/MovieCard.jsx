import React from 'react';
import { Link } from 'react-router-dom';
import { posterOrPlaceholder } from '../api/omdb';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  const poster = posterOrPlaceholder(movie.Poster);


  return (
    <Link to={`/movie/${movie.imdbID}`} className="movie-card-link">
      <div className="movie-card">
        <img src={poster} alt={movie.Title} loading="lazy" />
        <div className="movie-info">
          <h3>{movie.Title}</h3>
          <p>{movie.Year}</p>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;