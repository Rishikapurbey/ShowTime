import { useAuth } from '../context/auth-context';
import { useSignInPrompt } from '../context/sign-in-prompt-context';

// Add/remove behaviour for a watchlist button. Signed-out visitors are asked to sign in instead.
// `movie` may be undefined while it loads; only call toggle once it has arrived.
const useWatchlistToggle = (movie) => {
  const { currentUser, watchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const promptSignIn = useSignInPrompt();
  const inWatchlist = watchlist.some((m) => m.imdbID === movie?.imdbID);

  const toggle = () => {
    if (inWatchlist) {
      removeFromWatchlist(movie.imdbID);
      return;
    }
    const { imdbID, Title, Poster, Year } = movie;
    const entry = { imdbID, Title, Poster, Year };
    if (currentUser) addToWatchlist(entry);
    else promptSignIn(entry);
  };

  return { inWatchlist, toggle };
};

export default useWatchlistToggle;
