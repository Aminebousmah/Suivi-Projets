import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages sert le site sous /<dépôt>/ ; en local et ailleurs, à la racine.
  base: process.env.PAGES_BASE ?? '/',
  build: {
    rollupOptions: {
      output: {
        // React change rarement, l'application souvent : dans deux fichiers
        // séparés, une mise à jour d'Atlas n'oblige pas le navigateur à
        // retélécharger la bibliothèque qu'il a déjà en cache.
        manualChunks(id: string) {
          if (id.includes('node_modules/react')) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    // La logique pure se teste sans navigateur : seuls les tests de rendu
    // demandent jsdom, par une directive en tête de leur fichier.
    environment: 'node',
    setupFiles: ['./src/setupTests.ts'],
    globals: false,
    restoreMocks: true,
  },
});
