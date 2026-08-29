import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api/sq-menu': {
        target: 'https://cifp.auto.prod.c0.singaporeair.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sq-menu/, '/api/menu'),
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api/sq-menu': {
        target: 'https://cifp.auto.prod.c0.singaporeair.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sq-menu/, '/api/menu'),
        secure: false,
      },
    },
  },
});
