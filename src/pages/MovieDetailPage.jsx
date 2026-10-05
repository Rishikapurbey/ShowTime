import React, { useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMovieDetails, posterOrPlaceholder } from '../api/omdb';
import { AuthContext } from '../context/AuthContext';
import './MovieDetailPage.css';

const MovieDetailPage = () => {
  const { id } = useParams();
  const { watchlist, addToWatchlist, removeFromWatchlist, currentUser } = useContext(AuthContext);

  const isMovieInWatchlist = watchlist.some(movie => movie.imdbID === id);

  const { data: movieDetails, isLoading, isError } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id),
  });

  const handleWatchlistClick = () => {
    if (isMovieInWatchlist) {
      removeFromWatchlist(id);
    } else {
      const movieToAdd = {
        imdbID: movieDetails.imdbID,
        Title: movieDetails.Title,
        Poster: movieDetails.Poster,
        Year: movieDetails.Year,
      };
      addToWatchlist(movieToAdd);
    }
  };

  if (isLoading) {
    return (
      <div className="detail-page">
        <p className="status-message">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="detail-page">
        <Link to="/" className="back-link">← Back to Home</Link>
        <p className="status-message error">Couldn't load this movie. It may not exist, or the server is unavailable.</p>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <div className="detail-content">
        <div className="detail-left-column">
          <img src={posterOrPlaceholder(movieDetails.Poster)} alt={movieDetails.Title} className="detail-poster" />
          {currentUser && (
            <button onClick={handleWatchlistClick} className="watchlist-button">
              {isMovieInWatchlist ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
            </button>
          )}
        </div>
        <div className="detail-info">
          <h1>{movieDetails.Title} ({movieDetails.Year})</h1>
          <p className="plot">{movieDetails.Plot}</p>

          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Genre</span>
              <span className="detail-value">{movieDetails.Genre}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Director</span>
              <span className="detail-value">{movieDetails.Director}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Actors</span>
              <span className="detail-value">{movieDetails.Actors}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Runtime</span>
              <span className="detail-value">{movieDetails.Runtime}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Rated</span>
              <span className="detail-value">{movieDetails.Rated}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Awards</span>
              <span className="detail-value">{movieDetails.Awards}</span>
            </div>
          </div>

          <div className="ratings">
            <h3>Ratings</h3>
            {movieDetails.Ratings && movieDetails.Ratings.map((rating, index) => (
              <div key={index} className="rating-source">
                <strong>{rating.Source}:</strong> {rating.Value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;