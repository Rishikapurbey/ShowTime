import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './MovieDetailPage.css';

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const { watchlist, addToWatchlist, removeFromWatchlist, currentUser } = useContext(AuthContext);

  const isMovieInWatchlist = watchlist.some(movie => movie.imdbID === id);

  useEffect(() => {
    const fetchDetails = async () => {
      const response = await axios.get(`http://www.omdbapi.com/?i=${id}&apikey=595c2e8f&plot=full`);
      setMovieDetails(response.data);
    };
    fetchDetails();
  }, [id]);

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

  if (!movieDetails) return <div>Loading...</div>;

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <div className="detail-content">
        <div className="detail-left-column">
          <img src={movieDetails.Poster} alt={movieDetails.Title} className="detail-poster" />
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