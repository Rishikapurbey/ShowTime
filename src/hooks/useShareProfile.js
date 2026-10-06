import { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { loadFirestore } from '../lib/firebase';

export class UsernameTaken extends Error {}

// The signed-in user's share settings: profiles/{uid} = { username, public }, live-synced.
// `profile` is undefined while loading and null if they've never created a link.
const useShareProfile = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    setProfile(undefined);
    if (!uid) return;
    let unsubscribe;
    let cancelled = false;

    loadFirestore()
      .then((fs) => {
        if (cancelled) return;
        unsubscribe = fs.onSnapshot(
          fs.doc(fs.db, 'profiles', uid),
          (snapshot) => setProfile(snapshot.exists() ? snapshot.data() : null),
          (error) => console.error('Could not load share settings:', error)
        );
      })
      .catch((error) => console.error('Could not load Firestore:', error));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid]);

  // Creates the link, or renames it. The name and the profile are written together, and
  // a rename releases the old name in the same write, as firestore.rules requires.
  const claimUsername = async (username) => {
    if (username === profile?.username) return;
    const fs = await loadFirestore();
    const nameRef = fs.doc(fs.db, 'usernames', username);

    const existing = await fs.getDoc(nameRef);
    if (existing.exists() && existing.data().uid !== uid) throw new UsernameTaken();

    const batch = fs.writeBatch(fs.db);
    if (profile?.username && profile.username !== username) {
      batch.delete(fs.doc(fs.db, 'usernames', profile.username));
    }
    batch.set(nameRef, { uid });
    batch.set(fs.doc(fs.db, 'profiles', uid), { username, public: profile?.public ?? true });

    try {
      await batch.commit();
    } catch (error) {
      // Someone else claimed it between the check and the write.
      if (error.code === 'permission-denied') throw new UsernameTaken();
      throw error;
    }
  };

  const setPublic = async (isPublic) => {
    const fs = await loadFirestore();
    await fs.updateDoc(fs.doc(fs.db, 'profiles', uid), { public: isPublic });
  };

  return { profile, claimUsername, setPublic };
};

export default useShareProfile;
