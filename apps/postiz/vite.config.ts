import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kupuri/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@kupuri/config': path.resolve(__dirname, '../../packages/config/src'),
      '@kupuri/ecosystem-types': path.resolve(__dirname, '../../packages/ecosystem-types/src'),
    },
  },
  server: {
    port: 3001, // Different port from web app
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
