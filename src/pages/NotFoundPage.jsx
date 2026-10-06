import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <span className="not-found-code">404</span>
      <h1>Lost in the multiverse?</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="not-found-button">Back to Home</Link>
    </div>
  );
};

export default NotFoundPage;
