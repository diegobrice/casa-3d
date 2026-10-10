import { defineConfig } from 'vite';

export default defineConfig({
  base: './',   // rutas relativas: el build funciona en cualquier subcarpeta
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },   // three en su propio chunk cacheable
    },
  },
});
