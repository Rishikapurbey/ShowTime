import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Firestore rules tests need the emulator; they run separately with `npm run test:rules`.
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: './src/test/setup.js',
  },
  build: {
    // The only file over Vite's default 500 kB is the Firestore SDK (~660 kB, ~170 kB gzipped).
    // It is already loaded lazily (see src/lib/firebase.js) — only once someone signs in or opens
    // a shared watchlist — so it never slows the homepage. Warn if anything grows past that.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Libraries change far less often than app code, so give them their own file
        // that browsers can keep cached across deploys.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@tanstack|axios)\//.test(id)) {
            return 'vendor';
          }
        },
      },
    },
  },
})
