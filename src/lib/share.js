// Share-link names, e.g. /u/movie_fan. Must match the pattern in firestore.rules.
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const normalizeUsername = (name) => name.trim().toLowerCase();

// A message saying what's wrong with `name`, or null if it's fine. Expects a normalized name.
export const usernameError = (name) => {
  if (name.length < 3) return 'Use at least 3 characters.';
  if (name.length > 20) return 'Use at most 20 characters.';
  if (!USERNAME_PATTERN.test(name)) return 'Use only letters, numbers and underscores.';
  return null;
};

export const shareUrl = (username) => `${window.location.origin}/u/${username}`;
