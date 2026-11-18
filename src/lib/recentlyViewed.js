// Recently viewed movies, newest first. Kept short so the whole list fits in one small
// Firestore document (and the security rules can cap its size).
export const MAX_RECENT = 20;

// Signed-out history used to be kept in the browser under this key.
export const LEGACY_LOCAL_KEY = 'showtime_recently_viewed';

const pick = ({ imdbID, Title, Poster, Year }) => ({ imdbID, Title, Poster, Year });

// Moves `movie` to the front, dropping any earlier copy of it.
export const addRecent = (list, movie) =>
  [pick(movie), ...list.filter((m) => m.imdbID !== movie.imdbID)].slice(0, MAX_RECENT);

export const sameRecent = (a, b) =>
  a.length === b.length && a.every((m, i) => m.imdbID === b[i].imdbID);

// localStorage can be unavailable (private mode, blocked storage); never let that break the page.
export const removeLegacyRecent = () => {
  try {
    localStorage.removeItem(LEGACY_LOCAL_KEY);
  } catch {
    // Nothing to clean up if storage can't be reached.
  }
};
