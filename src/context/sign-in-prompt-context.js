import { createContext, useContext } from 'react';

// Kept separate from SignInPromptProvider.jsx so that file only exports a component (needed for fast refresh).
export const SignInPromptContext = createContext(null);

// Returns promptSignIn(movie), which asks a signed-out visitor to sign in to save that movie.
export const useSignInPrompt = () => useContext(SignInPromptContext);
