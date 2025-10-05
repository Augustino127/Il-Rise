import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
        gameV3: resolve(__dirname, 'game-v3.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
