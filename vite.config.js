import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  build: {
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
