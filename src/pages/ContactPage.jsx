import React from 'react';
import { Link } from 'react-router-dom';
import './ContactPage.css';

const ContactPage = () => {
  return (
    <div className="contact-page">
      <div className="contact-container">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>Contact Us</h1>
        <p>If you have any questions or just want to connect, feel free to reach out.</p>
        <div className="contact-methods">
          <div className="contact-method">
            <h3>📧 Email</h3>
            <a href="mailto:rishikapurbey712@gmail.com">rishikapurbey712@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;