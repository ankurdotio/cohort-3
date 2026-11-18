import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [ react(), tailwindcss() ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    // Let jsdom own browser storage instead of Node 25+'s native globals.
    execArgv: [ '--no-experimental-webstorage' ],
    setupFiles: './src/test/setup.js',
    clearMocks: true,
  },
});
