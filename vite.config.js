import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      external: ['https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.21.0/dist/tf.min.js']
    }
  },
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs']
  }
});
