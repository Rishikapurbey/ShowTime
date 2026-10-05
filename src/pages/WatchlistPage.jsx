import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import MovieList from '../components/MovieList';
import { Link } from 'react-router-dom';
import './WatchlistPage.css'; 

const WatchlistPage = () => {
  const { watchlist, currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return (
      <div className="watchlist-page">
        <div className="watchlist-message">
          <h1>Please Login</h1>
          <p>You need to be logged in to see your watchlist.</p>
          <Link to="/login" className="login-button">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <h1>My Watchlist</h1>
      {watchlist.length > 0 ? (
        <MovieList movies={watchlist} />
      ) : (
        <p className="watchlist-message">Your watchlist is empty. Add some movies!</p>
      )}
    </div>
  );
};

export default WatchlistPage;