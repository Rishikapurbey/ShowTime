import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { authErrorMessage } from '../lib/authErrors';
import GoogleButton from '../components/GoogleButton';
import './AuthForm.css';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || '/';

  const run = async (action) => {
    setError('');
    setSubmitting(true);
    try {
      await action();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = authErrorMessage(err);
      if (message) setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    run(() => signup(name.trim(), email, password));
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="form-logo">
          <h1>ShowTime</h1>
        </Link>
        <h2>Sign Up</h2>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (at least 6 characters)"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <GoogleButton onClick={() => run(loginWithGoogle)} disabled={submitting} />
        <p className="auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Log in now.</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
