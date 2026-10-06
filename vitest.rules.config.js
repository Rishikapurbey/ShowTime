import { defineConfig } from 'vitest/config';

// Firestore security rules tests. They need the emulator, so run them with `npm run test:rules`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules-tests/**/*.test.js'],
    // All files share one emulator database.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
