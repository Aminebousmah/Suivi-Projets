import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { REPOS } from '../../data/repos';
import { buildCoverage } from '../coverage';
import type { TreeEntry } from '../github';

/**
 * Atlas se décrit lui-même : tout fichier suivi par git doit être cité par au
 * moins une fonctionnalité. Ce test échoue donc à chaque fichier ajouté sans
 * description — c'est exactement ce qu'on lui demande.
 */
describe('Atlas se décrit en entier', () => {
  const tracked = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  const entries: TreeEntry[] = tracked.map((path) => ({ path, type: 'blob', size: 1 }));

  it('ne laisse aucun fichier sans fonctionnalité', () => {
    const { orphans } = buildCoverage(REPOS.atlas, entries);
    expect(
      orphans,
      orphans.length
        ? `À décrire dans src/data/repos.ts, ou à retirer du dépôt :\n  ${orphans.join('\n  ')}`
        : '',
    ).toEqual([]);
  });

  it('a bien lu le dépôt, et pas une liste vide', () => {
    expect(tracked.length).toBeGreaterThan(20);
    expect(tracked).toContain('src/data/repos.ts');
  });
});
