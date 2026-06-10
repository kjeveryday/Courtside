/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Security default (CLAUDE.md rule 15): loopback only, fixed harness port
    // (rule 10). strictPort: a busy 4310 must fail loudly, never drift silently.
    host: '127.0.0.1',
    port: 4310,
    strictPort: true,
  },
  test: {
    environment: 'node',
    // TASK-2 lands the first real suite; until then `npm run check` must not
    // fail on an intentionally empty test set.
    passWithNoTests: true,
  },
});
