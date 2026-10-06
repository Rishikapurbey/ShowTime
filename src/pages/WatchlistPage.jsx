import React from 'react';
import { useAuth } from '../context/auth-context';
import MovieList from '../components/MovieList';
import { Link, useLocation } from 'react-router-dom';
import './WatchlistPage.css'; 

const WatchlistPage = () => {
  const { watchlist, currentUser, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="watchlist-page">
        <p className="status-message">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="watchlist-page">
        <div className="watchlist-message">
          <h1>Please Login</h1>
          <p>You need to be logged in to see your watchlist.</p>
          <Link to="/login" state={{ from: location.pathname }} className="login-button">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <h1>My Watchlist{watchlist.length > 0 && <span className="watchlist-count"> · {watchlist.length}</span>}</h1>
      {watchlist.length > 0 ? (
        <MovieList movies={watchlist} layout="grid" />
      ) : (
        <p className="watchlist-message">Your watchlist is empty. Add some movies!</p>
      )}
    </div>
  );
};

export default WatchlistPage;