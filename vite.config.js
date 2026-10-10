import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = 'http://localhost:4317';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    port: 5317,
    fs: { allow: ['..'] },
    proxy: { '/api': api, '/card': api, '/uploads': api },
  },
});
