import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { authErrorMessage } from '../lib/authErrors';
import GoogleButton from '../components/GoogleButton';
import './AuthForm.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Return to the page that sent the user here (e.g. the watchlist), or home.
  const redirectTo = location.state?.from || '/';

  const run = async (action) => {
    setError('');
    setNotice('');
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

  const handleLogin = (e) => {
    e.preventDefault();
    run(() => login(email, password));
  };

  const handleForgotPassword = async () => {
    setError('');
    setNotice('');
    if (!email) {
      setError('Enter your email above, then click "Forgot password?" again.');
      return;
    }
    try {
      await resetPassword(email);
      setNotice(`If an account exists for ${email}, a password reset link is on its way.`);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="form-logo">
          <h1>ShowTime</h1>
        </Link>
        <h2>Login</h2>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <form onSubmit={handleLogin}>
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
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="button" className="auth-forgot" onClick={handleForgotPassword}>
            Forgot password?
          </button>
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <GoogleButton onClick={() => run(loginWithGoogle)} disabled={submitting} />
        <p className="auth-switch">
          New to ShowTime? <Link to="/signup" state={location.state}>Sign up now.</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
