import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const name = email.split('@')[0];
    login({ email, name });
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Link to="/" className="form-logo">
          <h1>ShowTime</h1>
        </Link>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
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
          <button type="submit" className="login-form-button">Login</button>
        </form>
        <p className="signup-link">
          New to ShowTime? <Link to="/signup">Sign up now.</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;