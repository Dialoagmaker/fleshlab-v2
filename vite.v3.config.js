import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'v3',
  base: '/v3/',
  plugins: [react()],
  build: { outDir: '../dist-v3', emptyOutDir: true, sourcemap: false, cssCodeSplit: true },
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true } } }
});
