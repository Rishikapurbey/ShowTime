// Recently viewed movies, newest first. Kept short so the whole list fits in one small
// Firestore document (and the security rules can cap its size).
export const MAX_RECENT = 20;

// Where signed-out visitors' history is kept.
export const LOCAL_KEY = 'showtime_recently_viewed';

const pick = ({ imdbID, Title, Poster, Year }) => ({ imdbID, Title, Poster, Year });

// Moves `movie` to the front, dropping any earlier copy of it.
export const addRecent = (list, movie) =>
  [pick(movie), ...list.filter((m) => m.imdbID !== movie.imdbID)].slice(0, MAX_RECENT);

// Combines two lists, keeping `first`'s order and skipping movies already in it.
export const mergeRecent = (first, second) => {
  const ids = new Set(first.map((m) => m.imdbID));
  return [...first, ...second.filter((m) => !ids.has(m.imdbID))].slice(0, MAX_RECENT);
};

export const sameRecent = (a, b) =>
  a.length === b.length && a.every((m, i) => m.imdbID === b[i].imdbID);

// localStorage can be unavailable (private mode, blocked storage) or hold junk; never let
// that break the page.
export const readLocalRecent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY));
    return Array.isArray(list) ? list.filter((m) => m?.imdbID).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

export const writeLocalRecent = (list) => {
  try {
    if (list.length) localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    else localStorage.removeItem(LOCAL_KEY);
  } catch {
    // Not worth surfacing: the list just won't survive a reload.
  }
};
