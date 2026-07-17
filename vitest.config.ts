import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load a custom env file when provided (e.g. DOTENV_CONFIG_PATH=.env.staging),
// otherwise fall back to the default .env. Integration tests read DATABASE_URL
// from this so they can target a STAGING database without touching production.
const envPath = process.env.DOTENV_CONFIG_PATH;
if (envPath) {
  dotenvConfig({ path: resolve(__dirname, envPath) });
} else {
  dotenvConfig({ path: resolve(__dirname, '.env') });
}

// Node-environment tests: unit logic + integration (staging-gated).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
