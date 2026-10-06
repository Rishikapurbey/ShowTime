import { createContext, useContext } from 'react';

// Kept separate from RecentlyViewedProvider.jsx so that file only exports a component (needed for fast refresh).
export const RecentlyViewedContext = createContext(null);

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);
