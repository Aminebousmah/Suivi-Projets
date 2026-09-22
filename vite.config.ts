import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages sert le site sous /<dépôt>/ ; en local et ailleurs, à la racine.
  base: process.env.PAGES_BASE ?? '/',
  test: {
    // La logique pure se teste sans navigateur : seuls les tests de rendu
    // demandent jsdom, par une directive en tête de leur fichier.
    environment: 'node',
    setupFiles: ['./src/setupTests.ts'],
    globals: false,
    restoreMocks: true,
  },
});
