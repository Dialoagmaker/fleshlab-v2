import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'v3',
  base: '/admin/',
  plugins: [react()],
  build: { outDir: '../dist-admin', emptyOutDir: true, sourcemap: false, cssCodeSplit: true, rollupOptions: { input: { index: path.resolve('v3/admin.html') } } },
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true } } }
});
