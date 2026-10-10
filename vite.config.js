import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { BRAND } from './shared/brand.js';

// fills the site name into index.html so it only lives in shared/brand.js
const brand = {
  name: 'brand',
  transformIndexHtml: (html) => html.replaceAll('%BRAND_NAME%', BRAND.name).replaceAll('%BRAND_COLOR%', BRAND.themeColor),
};

export default defineConfig({
  root: 'client',
  plugins: [react(), brand],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { port: 5317, fs: { allow: ['..'] } },
});
