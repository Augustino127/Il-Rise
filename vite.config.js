import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

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
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  },
  plugins: [
    {
      name: 'copy-json-files',
      closeBundle() {
        // Copy tutorial JSON
        try {
          mkdirSync('dist/src/tutorial', { recursive: true });
          copyFileSync('src/tutorial/tutorialSteps.json', 'dist/src/tutorial/tutorialSteps.json');
        } catch (e) { console.warn('Tutorial JSON not copied:', e.message); }

        // Copy knowledge cards JSON
        try {
          mkdirSync('dist/src/data', { recursive: true });
          copyFileSync('src/data/knowledgeCards.json', 'dist/src/data/knowledgeCards.json');
        } catch (e) { console.warn('Knowledge cards JSON not copied:', e.message); }
      }
    }
  ]
});
