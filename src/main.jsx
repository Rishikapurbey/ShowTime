import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthProvider';
import { RecentlyViewedProvider } from './context/RecentlyViewedProvider';
import App from './App.jsx';
import './index.css';

// Cache responses for 10 minutes so navigating back doesn't re-fetch every row
// (OMDb's free tier is limited to 1,000 requests/day).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RecentlyViewedProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RecentlyViewedProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
