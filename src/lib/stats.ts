import type { Domain, Stat } from '../data/types';

/**
 * Les chiffres de l'en-tête qui comptent l'arbre — domaines et fonctions — se
 * recomptent sur l'arbre affiché : une fois atlas.md lu, ceux de la description
 * figée ne disent plus vrai. Les autres chiffres restent tels quels.
 */
export function statsFor(stats: Stat[], domains: Domain[]): Stat[] {
  if (!domains.length) return stats;
  const features = domains.reduce((n, d) => n + d.features.length, 0);
  return stats.map((s) => {
    if (s.k === 'domaines') return { ...s, v: String(domains.length) };
    if (s.k === 'fonctions') return { ...s, v: String(features) };
    return s;
  });
}
