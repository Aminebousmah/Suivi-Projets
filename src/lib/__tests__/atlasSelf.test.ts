import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPOS } from '../../data/repos';
import { parseAtlasFile } from '../atlasFile';
import { buildCoverage } from '../coverage';
import type { RepoData } from '../../data/types';
import type { TreeEntry } from '../github';
import { extractPath } from '../verify';

/**
 * Atlas se décrit deux fois : dans `src/data/repos.ts`, qui alimente
 * l'application hors connexion, et dans `atlas.md`, que le dépôt fournit et que
 * l'application relit. Deux descriptions, c'est deux occasions de diverger : ces
 * tests le disent tout de suite.
 */
describe('atlas.md et la description figée se répondent', () => {
  const text = readFileSync('atlas.md', 'utf8');
  const doc = parseAtlasFile({ path: 'atlas.md', text, bytes: text.length })!;
  const figee = REPOS.atlas;

  const paths = (repo: { domains: { features: { files: string[] }[] }[] }) =>
    new Set(
      repo.domains.flatMap((d) => d.features.flatMap((f) => f.files.map(extractPath))),
    );

  it('se lit sans peine', () => {
    expect(doc.domains.length).toBeGreaterThan(0);
    expect(doc.tracking.length).toBeGreaterThan(0);
    expect(doc.does.length).toBeGreaterThan(0);
  });

  it('décrit les mêmes domaines', () => {
    expect(doc.domains.map((d) => d.name)).toEqual(figee.domains.map((d) => d.name));
  });

  it('décrit les mêmes fonctionnalités, avec les mêmes statuts', () => {
    const nom = (r: { domains: { features: { name: string; status?: string }[] }[] }) =>
      r.domains.flatMap((d) => d.features.map((f) => `${f.name} · ${f.status}`));
    expect(nom(doc)).toEqual(nom(figee));
  });

  it('cite les mêmes fichiers', () => {
    const manquants = [...paths(figee)].filter((p) => !paths(doc).has(p));
    const enTrop = [...paths(doc)].filter((p) => !paths(figee).has(p));
    expect(
      { manquants, enTrop },
      'atlas.md et src/data/repos.ts ne citent plus les mêmes chemins',
    ).toEqual({ manquants: [], enTrop: [] });
  });

  it('couvre tout le dépôt, comme la description figée', () => {
    const entries: TreeEntry[] = execSync('git ls-files', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map((path) => ({ path, type: 'blob', size: 1 }));

    const vivant = { ...figee, domains: doc.domains } as RepoData;
    const { orphans } = buildCoverage(vivant, entries);
    expect(
      orphans,
      orphans.length ? `À décrire dans atlas.md :\n  ${orphans.join('\n  ')}` : '',
    ).toEqual([]);
  });
});
