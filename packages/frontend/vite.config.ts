import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://api.cognomega.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/(?:api\/)+/i, '/api/'),
      },
      '/auth':   { target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/health': { target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/healthz':{ target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/ready':  { target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/usage':  { target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/billing':{ target: 'https://api.cognomega.com', changeOrigin: true, secure: true }
    }
  },
});