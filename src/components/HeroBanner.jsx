import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMovieDetails, posterOrPlaceholder, showPlaceholderOnError } from '../api/omdb';
import { AuthContext } from '../context/AuthContext';
import './HeroBanner.css';

// OMDb has no "trending" endpoint, so the featured movie rotates daily through a hand-picked list.
const FEATURED_IDS = [
  'tt16311594', // F1: The Movie
  'tt15398776', // Oppenheimer
  'tt15239678', // Dune: Part Two
  'tt6263850', // Deadpool & Wolverine
  'tt0816692', // Interstellar
  'tt1375666', // Inception
  'tt9362722', // Spider-Man: Across the Spider-Verse
  'tt1160419', // Dune: Part One
  'tt0468569', // The Dark Knight
  'tt1745960', // Top Gun: Maverick
  'tt0111161', // The Shawshank Redemption
  'tt4154796', // Avengers: Endgame
];

const dayNumber = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
const featuredId = FEATURED_IDS[dayNumber % FEATURED_IDS.length];

const HeroBanner = () => {
  const { currentUser, watchlist, addToWatchlist, removeFromWatchlist } = useContext(AuthContext);
  const { data: movie, isLoading, isError } = useQuery({
    queryKey: ['movie', featuredId],
    queryFn: () => getMovieDetails(featuredId),
  });

  if (isError) return null;

  if (isLoading) {
    return <section className="hero hero-skeleton" aria-hidden="true" />;
  }

  const poster = posterOrPlaceholder(movie.Poster);
  const inWatchlist = watchlist.some((m) => m.imdbID === movie.imdbID);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(movie.imdbID);
    } else {
      const { imdbID, Title, Poster, Year } = movie;
      addToWatchlist({ imdbID, Title, Poster, Year });
    }
  };

  return (
    <section className="hero">
      <div className="hero-backdrop" style={{ backgroundImage: `url(${poster})` }} />
      <div className="hero-content">
        <img src={poster} alt={movie.Title} className="hero-poster" onError={showPlaceholderOnError} />
        <div className="hero-text">
          <span className="hero-label">Featured Today</span>
          <h1>{movie.Title}</h1>
          <p className="hero-meta">
            {movie.imdbRating !== 'N/A' && <span className="hero-rating">★ {movie.imdbRating}</span>}
            {[movie.Year, movie.Runtime, movie.Genre].filter((v) => v && v !== 'N/A').join('  •  ')}
          </p>
          <p className="hero-plot">{movie.Plot}</p>
          <div className="hero-actions">
            <Link to={`/movie/${movie.imdbID}`} className="hero-button primary">
              More Info
            </Link>
            {currentUser && (
              <button onClick={toggleWatchlist} className="hero-button secondary">
                {inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
