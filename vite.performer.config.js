import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'v3',
  base: '/performer/',
  plugins: [react()],
  build: { outDir: '../dist-performer', emptyOutDir: true, sourcemap: false, cssCodeSplit: true, rollupOptions: { input: { index: path.resolve('v3/performer.html') } } },
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true } } }
});
