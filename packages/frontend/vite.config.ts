import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://api.cognomega.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api(\/api)?/, '/api'),
      },
      // Optional convenience passthroughs (kept from earlier)
      '/auth':   { target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/health': { target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/healthz':{ target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/ready':  { target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/usage':  { target: 'https://api.cognomega.com', changeOrigin: true, secure: true },
      '/billing':{ target: 'https://api.cognomega.com', changeOrigin: true, secure: true }
    }
  },
});