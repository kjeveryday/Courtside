/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Serve the contract directory as static files so the app fetches the fixture
  // from its single source location (spec §B4.2) — no copies, no sync step.
  publicDir: 'spec',
  server: {
    // Security default (CLAUDE.md rule 15): loopback only, fixed harness port
    // (rule 10). strictPort: a busy 4310 must fail loudly, never drift silently.
    host: '127.0.0.1',
    port: 4310,
    strictPort: true,
  },
  test: {
    environment: 'node',
  },
});
