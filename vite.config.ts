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
      '/api': {
        target: 'https://cifp.auto.prod.c0.singaporeair.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'https://inflightmenu.singaporeair.com',
          Referer: 'https://inflightmenu.singaporeair.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://cifp.auto.prod.c0.singaporeair.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'https://inflightmenu.singaporeair.com',
          Referer: 'https://inflightmenu.singaporeair.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      },
    },
  },
});
