import { loadFirestore } from '../lib/firebase';

// Thrown when a share link doesn't exist or its owner has switched sharing off;
// the page shows the same message for both so it doesn't reveal which.
export class WatchlistNotShared extends Error {}

// Loads the watchlist behind /u/:username, newest first. Works signed out.
export const fetchPublicWatchlist = async (username) => {
  const fs = await loadFirestore();

  try {
    const name = await fs.getDoc(fs.doc(fs.db, 'usernames', username));
    if (!name.exists()) throw new WatchlistNotShared();
    const { uid } = name.data();

    // Firestore only lets others read a profile, and the watchlist, while it's public.
    const profile = await fs.getDoc(fs.doc(fs.db, 'profiles', uid));
    if (!profile.data()?.public) throw new WatchlistNotShared();

    const snapshot = await fs.getDocs(
      fs.query(fs.collection(fs.db, 'users', uid, 'watchlist'), fs.orderBy('addedAt', 'desc'))
    );
    return { uid, username, movies: snapshot.docs.map((d) => d.data()) };
  } catch (error) {
    if (error.code === 'permission-denied') throw new WatchlistNotShared();
    throw error;
  }
};
