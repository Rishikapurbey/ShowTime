// Turn Firebase Auth error codes into messages a person can act on.
const MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'app/not-configured': "Accounts aren't available right now. You can still browse and search movies.",
  'auth/popup-blocked': 'The sign-in popup was blocked. Allow popups for this site and try again.',
};

// Closing the Google popup isn't an error worth showing.
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

export const authErrorMessage = (error) => {
  if (SILENT.has(error?.code)) return null;
  return MESSAGES[error?.code] || 'Something went wrong. Please try again.';
};
