import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SignInDialog from '../components/SignInDialog';
import Toast from '../components/Toast';
import { useAuth } from './auth-context';
import { SignInPromptContext } from './sign-in-prompt-context';

const TOAST_MS = 5000;

// Owns the "sign in to save this" flow: the dialog, then finishing the add once the visitor
// is back from the login or signup page (which return the movie in the router state).
// Its toast also reports watchlist changes that failed.
export const SignInPromptProvider = ({ children }) => {
  const { currentUser, addToWatchlistIfMissing, watchlistError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [promptMovie, setPromptMovie] = useState(null);
  const [toast, setToast] = useState(null);
  const handledLocation = useRef(null);

  // Leaving the page, including through the dialog's own links, dismisses the dialog.
  useEffect(() => {
    setPromptMovie(null);
  }, [location.key]);

  const movieToAdd = location.state?.addAfterSignIn;

  useEffect(() => {
    if (!movieToAdd || !currentUser || handledLocation.current === location.key) return;
    handledLocation.current = location.key;

    // Clear the state so a refresh or Back doesn't add the movie again.
    const { pathname, search, hash } = location;
    navigate({ pathname, search, hash }, { replace: true, state: null });

    const { Title } = movieToAdd;
    addToWatchlistIfMissing(movieToAdd).then(
      (added) =>
        setToast({
          message: added ? `${Title} is on your watchlist.` : `${Title} was already on your watchlist.`,
          showLink: true,
        }),
      (error) => {
        console.error('Could not add to watchlist:', error);
        setToast({ message: `Couldn't add ${Title}. Please try again.` });
      }
    );
  }, [movieToAdd, currentUser, location, navigate, addToWatchlistIfMissing]);

  useEffect(() => {
    if (watchlistError) setToast({ message: watchlistError.message });
  }, [watchlistError]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <SignInPromptContext.Provider value={setPromptMovie}>
      {children}
      {promptMovie && <SignInDialog movie={promptMovie} onClose={() => setPromptMovie(null)} />}
      <Toast>
        {toast && currentUser && (
          <>
            {toast.message}
            {toast.showLink && <Link to="/watchlist" onClick={() => setToast(null)}>View watchlist</Link>}
          </>
        )}
      </Toast>
    </SignInPromptContext.Provider>
  );
};
