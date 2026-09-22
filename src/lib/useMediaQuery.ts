import { useEffect, useState } from 'react';

/**
 * Suit une media query.
 *
 * Les styles de l'application sont en ligne, hérités de la maquette : une règle
 * CSS ne peut donc pas les adapter. C'est le composant qui doit savoir s'il est
 * à l'étroit — d'où ce hook plutôt qu'une feuille de style.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** En dessous, le panneau latéral passe sous le contenu et les tableaux se replient. */
export const NARROW = '(max-width: 720px)';

export function useNarrow(): boolean {
  return useMediaQuery(NARROW);
}
