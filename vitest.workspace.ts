import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.spec.ts'],
      setupFiles: [],
    },
  },
]);
