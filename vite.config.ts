/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The harness is the real server (`npm run dev` → scripts/dev.mjs, AD-8); vite is
// build + vitest only. publicDir off: the fixture is served by the server, gated.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false,
  test: {
    environment: 'node',
    globalSetup: './scripts/vitest-setup.mjs',
  },
});
