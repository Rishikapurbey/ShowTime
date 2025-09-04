import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]); 

 
  useEffect(() => {
    
    const storedUser = localStorage.getItem('showtime_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      const storedWatchlist = localStorage.getItem(`${user.email}_watchlist`);
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist));
      }
    }
  }, []);

  const login = (userData) => {
    const user = { name: userData.name || 'Guest', email: userData.email };
    localStorage.setItem('showtime_user', JSON.stringify(user));
    setCurrentUser(user);
    const storedWatchlist = localStorage.getItem(`${user.email}_watchlist`);
    setWatchlist(storedWatchlist ? JSON.parse(storedWatchlist) : []);
  };

  const logout = () => {
    localStorage.removeItem('showtime_user');
    setCurrentUser(null);
    setWatchlist([]); 
  };
  
  const addToWatchlist = (movie) => {
    const newWatchlist = [...watchlist, movie];
    setWatchlist(newWatchlist);
    if (currentUser) {
      localStorage.setItem(`${currentUser.email}_watchlist`, JSON.stringify(newWatchlist));
    }
  };

  const removeFromWatchlist = (movieId) => {
    const newWatchlist = watchlist.filter(movie => movie.imdbID !== movieId);
    setWatchlist(newWatchlist);
    if (currentUser) {
      localStorage.setItem(`${currentUser.email}_watchlist`, JSON.stringify(newWatchlist));
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};