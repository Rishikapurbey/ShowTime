import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SignupPage.css';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    alert(`Signup attempt with: ${email}`);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <Link to="/" className="form-logo">
          <h1>ShowTime</h1>
        </Link>
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="signup-form-button">Sign Up</button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Log in now.</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;