import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// Component tests (K) run in jsdom with React Testing Library.
//   pnpm test:component   (after `pnpm install` pulls in the new devDeps)
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: resolve(__dirname, '.env') });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
