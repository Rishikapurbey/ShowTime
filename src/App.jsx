import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import './App.css';

// The homepage ships with the main bundle; every other page is fetched when first visited.
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  const location = useLocation();
  const shouldShowFooter = location.pathname !== '/login' && location.pathname !== '/signup';

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}

export default App;