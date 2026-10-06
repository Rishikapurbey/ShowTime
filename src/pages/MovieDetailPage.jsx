import React, { useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMovieDetails, posterOrPlaceholder, showPlaceholderOnError } from '../api/omdb';
import { AuthContext } from '../context/AuthContext';
import './MovieDetailPage.css';

// OMDb uses the string "N/A" for missing fields.
const has = (value) => value && value !== 'N/A';

const RATING_SOURCES = {
  'Internet Movie Database': { label: 'IMDb', className: 'imdb' },
  'Rotten Tomatoes': { label: 'Rotten Tomatoes', className: 'rt' },
  Metacritic: { label: 'Metacritic', className: 'mc' },
};

const MovieDetailPage = () => {
  const { id } = useParams();
  const { watchlist, addToWatchlist, removeFromWatchlist, currentUser } = useContext(AuthContext);

  const isMovieInWatchlist = watchlist.some(movie => movie.imdbID === id);

  const { data: movieDetails, isLoading, isError } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id),
  });

  useEffect(() => {
    if (movieDetails) document.title = `${movieDetails.Title} (${movieDetails.Year}) · ShowTime`;
    return () => {
      document.title = 'ShowTime';
    };
  }, [movieDetails]);

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

  const poster = posterOrPlaceholder(movieDetails.Poster);
  const meta = [movieDetails.Rated, movieDetails.Year, movieDetails.Runtime, movieDetails.Genre].filter(has);
  const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movieDetails.Title} ${movieDetails.Year} official trailer`
  )}`;

  const facts = [
    ['Director', movieDetails.Director],
    ['Writers', movieDetails.Writer],
    ['Starring', movieDetails.Actors],
    ['Released', movieDetails.Released],
    ['Language', movieDetails.Language],
    ['Country', movieDetails.Country],
    ['Box Office', movieDetails.BoxOffice],
    ['Awards', movieDetails.Awards],
  ].filter(([, value]) => has(value));

  const ratings = (movieDetails.Ratings || []).filter((r) => RATING_SOURCES[r.Source]);

  return (
    <div className="detail-page-wrapper">
      {has(movieDetails.Poster) && (
        <div className="detail-backdrop" style={{ backgroundImage: `url(${poster})` }} />
      )}

      <div className="detail-page">
        <Link to="/" className="back-link">← Back to Home</Link>

        <div className="detail-content">
          <div className="detail-left-column">
            <img src={poster} alt={movieDetails.Title} className="detail-poster" onError={showPlaceholderOnError} />
            {currentUser && (
              <button onClick={handleWatchlistClick} className="watchlist-button">
                {isMovieInWatchlist ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
              </button>
            )}
          </div>

          <div className="detail-info">
            <h1>{movieDetails.Title}</h1>
            <p className="detail-meta">{meta.join('  •  ')}</p>

            <div className="detail-actions">
              {has(movieDetails.imdbRating) && (
                <div className="score">
                  <span className="score-value">★ {movieDetails.imdbRating}</span>
                  {has(movieDetails.imdbVotes) && (
                    <span className="score-count">{movieDetails.imdbVotes} votes</span>
                  )}
                </div>
              )}
              <a href={trailerUrl} target="_blank" rel="noreferrer" className="action-button">
                ▶ Watch Trailer
              </a>
              <a
                href={`https://www.imdb.com/title/${movieDetails.imdbID}/`}
                target="_blank"
                rel="noreferrer"
                className="action-button"
              >
                View on IMDb
              </a>
            </div>

            {has(movieDetails.Plot) && <p className="plot">{movieDetails.Plot}</p>}

            {ratings.length > 0 && (
              <div className="rating-badges">
                {ratings.map((rating) => (
                  <div key={rating.Source} className={`rating-badge ${RATING_SOURCES[rating.Source].className}`}>
                    <span className="rating-badge-value">{rating.Value}</span>
                    <span className="rating-badge-source">{RATING_SOURCES[rating.Source].label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="details-grid">
              {facts.map(([label, value]) => (
                <div key={label} className="detail-item">
                  <span className="detail-label">{label}</span>
                  <span className="detail-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
