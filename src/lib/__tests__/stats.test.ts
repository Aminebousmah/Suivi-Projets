import { describe, expect, it } from 'vitest';
import { REPOS } from '../../data/repos';
import { statsFor } from '../stats';

describe('statsFor', () => {
  const stats = [
    { v: '7', k: 'domaines' },
    { v: '44', k: 'fonctions' },
    { v: '131', k: 'pages' },
  ];

  it('recompte domaines et fonctions sur l’arbre affiché', () => {
    const domains = REPOS.atlas.domains.slice(0, 2);
    const features = domains[0].features.length + domains[1].features.length;
    expect(statsFor(stats, domains)).toEqual([
      { v: '2', k: 'domaines' },
      { v: String(features), k: 'fonctions' },
      { v: '131', k: 'pages' },
    ]);
  });

  it('laisse les chiffres tels quels sans arbre à compter', () => {
    expect(statsFor(stats, [])).toBe(stats);
  });

  it('retrouve les chiffres écrits quand l’arbre est la description figée', () => {
    const { stats: written, domains } = REPOS.atlas;
    expect(statsFor(written, domains)).toEqual(written);
  });
});
