import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null; 
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDisplayName = (email) => {
    if (!email) return '';
    const namePart = email.split('@')[0];
    const cleanName = namePart.replace(/[^a-zA-Z]/g, '');
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  };

  
  return (
    <div className='header'>
      <Link to="/" className="header-logo">
        <h1>ShowTime</h1>
      </Link>
      <div className="header-nav">
        {currentUser ? (
          <>
            <span className="welcome-message">Welcome, {getDisplayName(currentUser.email)}</span>
            <Link to="/watchlist" className="nav-link">Watchlist</Link>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
        ) : (
          <Link to="/login" className="login-button">Login</Link>
        )}
      </div>
    </div>
  );
};

export default Header;