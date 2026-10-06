import { createContext, useContext } from 'react';

// Kept separate from AuthProvider.jsx so that file only exports a component (needed for fast refresh).
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
