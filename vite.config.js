import { defineConfig } from 'vite';

export default defineConfig({
  // Base config to serve root files
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        // We'll add login page here later
      }
    }
  },
  server: {
    port: 3000
  }
});
