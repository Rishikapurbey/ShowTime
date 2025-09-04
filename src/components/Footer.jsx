import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <p>Made with ❤️</p>
          <h3 className="footer-logo">ShowTime</h3> 
        </div>
        <Link to="/contact" className="footer-link">Contact Us</Link>
      </div>
    </footer>
  );
};

export default Footer;