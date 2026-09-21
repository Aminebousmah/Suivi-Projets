import { describe, expect, it } from 'vitest';
import type { TreeEntry } from '../github';
import { parseSlug } from '../github';
import { checkPath, checkRepo, extractPath } from '../verify';

const TREE: TreeEntry[] = [
  'src/config/nav.ts',
  'src/config/features.ts',
  'src/components/sections/TenDoors.astro',
  'src/components/layout/Header.astro',
  'src/content/varieties/menton.md',
  'src/content/varieties/sorrento.md',
  'src/pages/varietes/[slug].astro',
  'src/lib/seo.ts',
  'README.md',
].map((path) => ({ path, type: 'blob' as const, size: 100 }));

const paths = new Set(TREE.map((e) => e.path));

describe('extractPath', () => {
  it("retire l'annotation après le tiret cadratin", () => {
    expect(extractPath('src/config/nav.ts — doors[]')).toBe('src/config/nav.ts');
  });

  it('laisse intact un chemin nu', () => {
    expect(extractPath('README.md')).toBe('README.md');
  });
});

describe('checkPath', () => {
  it('reconnaît un chemin exact', () => {
    const c = checkPath('src/lib/seo.ts — breadcrumb', paths);
    expect(c.kind).toBe('exact');
    expect(c.matches).toEqual(['src/lib/seo.ts']);
  });

  it('retrouve un chemin cité sans son préfixe src/', () => {
    const c = checkPath('components/sections/TenDoors.astro', paths);
    expect(c.kind).toBe('partiel');
    expect(c.matches).toEqual(['src/components/sections/TenDoors.astro']);
  });

  it('résout un dossier déclaré vers son contenu', () => {
    const c = checkPath('src/content/varieties/ — 32 fiches', paths);
    expect(c.kind).toBe('dossier');
    expect(c.matches).toHaveLength(2);
  });

  it('résout un motif générique', () => {
    const c = checkPath('src/config/*', paths);
    expect(c.kind).toBe('motif');
    expect(c.matches).toContain('src/config/nav.ts');
  });

  it('signale un fichier déplacé plutôt que disparu', () => {
    const c = checkPath('old/place/seo.ts', paths);
    expect(c.kind).toBe('déplacé');
    expect(c.matches).toEqual(['src/lib/seo.ts']);
  });

  it('déclare absent ce qui ne correspond à rien', () => {
    const c = checkPath('src/pages/drop.astro', paths);
    expect(c.kind).toBe('absent');
    expect(c.matches).toEqual([]);
  });

  it('ne retient que trois correspondances au plus', () => {
    const big = new Set(
      Array.from({ length: 9 }, (_, i) => `src/content/varieties/v${i}.md`),
    );
    expect(checkPath('src/content/varieties/', big).matches).toHaveLength(3);
  });

  it('préserve la déclaration brute pour l’affichage', () => {
    const c = checkPath('src/config/nav.ts — doors[]', paths);
    expect(c.declared).toBe('src/config/nav.ts — doors[]');
    expect(c.path).toBe('src/config/nav.ts');
  });
});

describe('checkRepo', () => {
  const repo = {
    domains: [
      {
        key: 'nav',
        name: 'Navigation',
        num: '01',
        tone: 'a' as const,
        role: '',
        detail: '',
        features: [
          {
            name: 'A',
            status: 'live' as const,
            what: '',
            files: ['src/config/nav.ts — doors[]', 'components/sections/TenDoors.astro'],
          },
          { name: 'B', status: 'live' as const, what: '', files: ['src/config/nav.ts — mainNav'] },
          { name: 'C', status: 'idea' as const, what: '', files: ['src/pages/drop.astro'] },
        ],
      },
    ],
  };

  it('compte les fichiers résolus et manquants, une fois par chemin', () => {
    const r = checkRepo(repo as never, TREE);
    // nav.ts est cité deux fois avec deux annotations : un seul chemin.
    expect(r.total).toBe(3);
    expect(r.resolved).toBe(2);
    expect(r.missing).toBe(1);
    expect(r.domains[0].missing).toBe(1);
  });

  it('ne compte pas deux fois le même fichier annoté différemment', () => {
    const twice = {
      domains: [
        {
          ...repo.domains[0],
          features: [
            { name: 'A', status: 'live' as const, what: '', files: ['README.md — install'] },
            { name: 'B', status: 'live' as const, what: '', files: ['README.md — flags'] },
          ],
        },
      ],
    };
    expect(checkRepo(twice as never, TREE).total).toBe(1);
  });
});

describe('parseSlug', () => {
  it('lit propriétaire, dépôt et branche', () => {
    expect(parseSlug('Aminebousmah/Sole-Citron · main · 593a784')).toEqual({
      owner: 'Aminebousmah',
      repo: 'Sole-Citron',
      branch: 'main',
    });
  });

  it('retombe sur main quand la branche est absente', () => {
    expect(parseSlug('Aminebousmah/Sole-Citron')).toMatchObject({ branch: 'main' });
  });

  it('refuse une chaîne qui n’est pas un dépôt', () => {
    expect(parseSlug('pas un slug')).toBeNull();
  });
});
