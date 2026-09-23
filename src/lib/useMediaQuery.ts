import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

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

/**
 * En dessous, l'arbre et son panneau ne tiennent plus côte à côte : le graphe a
 * besoin de place pour rester lisible sans défilement horizontal.
 */
export const STACKED = '(max-width: 1100px)';

export function useStacked(): boolean {
  return useMediaQuery(STACKED);
}

/**
 * Dans une bande qui défile horizontalement, amène l'élément actif
 * (`aria-current`) au centre. Sans cela, en étroit, le dépôt ou la vue qu'on
 * regarde peut rester hors de l'écran, à droite de la bande.
 *
 * Le défilement touche la bande seule, jamais la page : pas de saut vertical.
 */
export function useCenteredActive(strip: RefObject<HTMLElement | null>, key: string): void {
  useEffect(() => {
    const el = strip.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const active = el.querySelector<HTMLElement>('[aria-current]');
    if (!active) return;
    el.scrollLeft = active.offsetLeft - (el.clientWidth - active.clientWidth) / 2;
  }, [strip, key]);
}
