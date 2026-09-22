import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/** Les tests de logique pure tournent sans DOM : il n'y a alors rien à nettoyer. */
const hasDom = typeof window !== 'undefined';

afterEach(() => {
  if (!hasDom) return;
  cleanup();
  // Chaque test repart d'un stockage et d'une URL propres : l'état de
  // navigation vit dans l'URL, et le jeton comme le cache dans localStorage.
  try {
    localStorage.clear();
  } catch {
    /* stockage indisponible : rien à nettoyer */
  }
  window.history.replaceState(null, '', '/');
});

// jsdom n'implémente ni matchMedia ni scrollIntoView, dont l'application se sert.
if (hasDom && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (hasDom && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
