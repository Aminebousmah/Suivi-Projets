import { describe, expect, it } from 'vitest';
import { REPOS } from '../../data/repos';
import type { RepoData } from '../../data/types';
import { buildCoverage, describeRefs, folderNote, resolvedFor } from '../coverage';
import type { TreeEntry } from '../github';
import { checkRepo } from '../verify';

const file = (path: string, size = 100): TreeEntry => ({ path, type: 'blob', size });

const TREE: TreeEntry[] = [
  file('src/config/nav.ts'),
  file('src/components/sections/TenDoors.astro'),
  file('src/content/varieties/menton.md'),
  file('src/content/varieties/sorrento.md'),
  file('src/lib/seo.ts'),
  file('src/orphelin.ts'),
  file('README.md'),
  file('node_modules/react/index.js'),
];

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
          name: 'Les 10 portes',
          status: 'live' as const,
          what: '',
          files: ['src/config/nav.ts — doors[]', 'components/sections/TenDoors.astro'],
        },
        {
          name: 'Menu principal',
          status: 'live' as const,
          what: '',
          // deux déclarations, un seul fichier : la fonctionnalité ne doit
          // figurer qu'une fois sur ce chemin
          files: ['src/config/nav.ts — mainNav', 'src/config/nav.ts'],
        },
      ],
    },
    {
      key: 'editorial',
      name: 'Éditorial',
      num: '02',
      tone: 'b' as const,
      role: '',
      detail: '',
      features: [
        {
          name: 'Fiche variété',
          status: 'wip' as const,
          what: '',
          files: ['src/content/varieties/ — 32 fiches', 'src/pages/disparu.astro'],
        },
      ],
    },
  ],
} as unknown as RepoData;

describe('buildCoverage', () => {
  const c = buildCoverage(repo, TREE);

  it('rattache un fichier aux fonctionnalités qui le citent', () => {
    expect(c.byPath.get('src/config/nav.ts')?.map((r) => r.feature)).toEqual([
      'Les 10 portes',
      'Menu principal',
    ]);
  });

  it('ne compte pas deux fois la même fonctionnalité sur un fichier', () => {
    const refs = c.byPath.get('src/config/nav.ts')!;
    expect(refs.filter((r) => r.feature === 'Menu principal')).toHaveLength(1);
  });

  it('rattache tous les fichiers d’un dossier cité, sans troncature', () => {
    expect(c.byPath.get('src/content/varieties/menton.md')?.[0].feature).toBe('Fiche variété');
    expect(c.byPath.get('src/content/varieties/sorrento.md')?.[0].feature).toBe('Fiche variété');
  });

  it('retient comment le rattachement a été fait', () => {
    expect(c.byPath.get('src/config/nav.ts')?.[0].kind).toBe('exact');
    expect(c.byPath.get('src/components/sections/TenDoors.astro')?.[0].kind).toBe('partiel');
    expect(c.byPath.get('src/content/varieties/menton.md')?.[0].kind).toBe('dossier');
  });

  it('liste les fichiers que personne ne décrit, dans l’ordre du dépôt', () => {
    // seo.ts existe mais aucune fonctionnalité de cette description ne le cite.
    expect(c.orphans).toEqual(['src/lib/seo.ts', 'src/orphelin.ts', 'README.md']);
  });

  it('ignore l’outillage dans le décompte', () => {
    expect(c.total).toBe(7);
    expect(c.byPath.has('node_modules/react/index.js')).toBe(false);
  });

  it('compte les fichiers décrits', () => {
    expect(c.described).toBe(4);
    expect(c.described + c.orphans.length).toBe(c.total);
  });

  it('ne se laisse pas troubler par une déclaration qui ne mène à rien', () => {
    const cited = [...c.byPath.values()].flat().map((r) => r.feature);
    expect(cited).toContain('Fiche variété');
    expect(c.byPath.has('src/pages/disparu.astro')).toBe(false);
  });

  it('classe les dossiers du moins décrit au plus décrit', () => {
    expect(c.byFolder[0].described / c.byFolder[0].files).toBeLessThanOrEqual(
      c.byFolder[c.byFolder.length - 1].described / c.byFolder[c.byFolder.length - 1].files,
    );
    expect(c.byFolder.find((f) => f.folder === 'src/content/varieties')).toEqual({
      folder: 'src/content/varieties',
      files: 2,
      described: 2,
    });
  });

  it('range les fichiers de la racine sous « racine »', () => {
    expect(c.byFolder.find((f) => f.folder === 'racine')).toMatchObject({ files: 1, described: 0 });
  });

  it('rend un croisement vide sur un dépôt sans fichier lisible', () => {
    const empty = buildCoverage(repo, [file('node_modules/x.js')]);
    expect(empty.total).toBe(0);
    expect(empty.orphans).toEqual([]);
    expect(empty.byFolder).toEqual([]);
  });
});

describe('describeRefs', () => {
  it('nomme le domaine et la fonctionnalité', () => {
    expect(
      describeRefs([
        { domainKey: 'a', domainName: 'Navigation', feature: 'Menu', kind: 'exact' },
      ]),
    ).toEqual(['Navigation → Menu']);
  });

  it('dit clairement quand rien ne cite le fichier', () => {
    expect(describeRefs([])[0]).toMatch(/Aucune fonctionnalité/);
    expect(describeRefs(undefined)[0]).toMatch(/Aucune fonctionnalité/);
  });
});

describe('folderNote', () => {
  const c = buildCoverage(repo, TREE);

  it('résume la part décrite d’un dossier', () => {
    expect(folderNote(c, 'src/content/varieties')).toBe('2/2 décrit(s)');
    expect(folderNote(c, 'racine')).toBe('0/1 décrit(s)');
  });

  it('ne dit rien d’un dossier inconnu', () => {
    expect(folderNote(c, 'néant')).toBeNull();
  });
});

describe('sur les vraies données', () => {
  it.each(Object.keys(REPOS))('%s : le croisement tient debout', (key) => {
    const entries = REPOS[key].domains.flatMap((d) =>
      d.features.flatMap((f) => f.files.map((path) => file(path.split('—')[0].trim()))),
    );
    const c = buildCoverage(REPOS[key], entries);
    expect(c.described).toBeGreaterThan(0);
    expect(c.described + c.orphans.length).toBe(c.total);
  });
});

describe('resolvedFor', () => {
  const check = checkRepo(repo, TREE);

  it('dit ce qu’un chemin cité donne dans le dépôt', () => {
    expect(resolvedFor(check, 'nav', ['src/config/nav.ts — doors[]'])).toEqual([
      'exact · src/config/nav.ts',
    ]);
  });

  it('retrouve le résultat même sous une autre déclaration du même chemin', () => {
    // checkRepo ne garde qu'un contrôle par chemin : ici celui de « doors[] ».
    expect(resolvedFor(check, 'nav', ['src/config/nav.ts — mainNav'])).toEqual([
      'exact · src/config/nav.ts',
    ]);
  });

  it('signale un chemin cité qui n’existe pas', () => {
    expect(resolvedFor(check, 'editorial', ['src/pages/disparu.astro'])).toEqual([
      'absent · src/pages/disparu.astro',
    ]);
  });

  it('énumère les fichiers d’un dossier cité', () => {
    const [line] = resolvedFor(check, 'editorial', ['src/content/varieties/ — 32 fiches']);
    expect(line).toMatch(/^dossier · src\/content\/varieties\//);
  });

  it('ne rend rien sans dépôt lu, ni pour un domaine inconnu', () => {
    expect(resolvedFor(null, 'nav', ['src/config/nav.ts'])).toEqual([]);
    expect(resolvedFor(check, 'néant', ['src/config/nav.ts'])).toEqual([]);
  });
});
