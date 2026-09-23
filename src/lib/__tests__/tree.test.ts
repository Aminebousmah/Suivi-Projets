import { describe, expect, it } from 'vitest';
import type { ChangedFile, CommitInfo, TreeEntry } from '../github';
import { activityIndex, describeChange, summarize, windowFrom } from '../activity';
import { buildDomainsFromTree, groupByFolder, meaningfulFiles } from '../tree';

const file = (path: string, size = 1000): TreeEntry => ({ path, type: 'blob', size });

const TREE: TreeEntry[] = [
  file('README.md', 4700),
  file('package.json', 900),
  file('src/App.tsx', 8000),
  file('src/main.tsx', 300),
  file('src/data/types.ts', 3000),
  file('src/data/repos.ts', 40000),
  file('src/lib/graph.ts', 7000),
  file('src/lib/url.ts', 3000),
  file('src/lib/__tests__/graph.test.ts', 6000),
  file('src/views/ArchView.tsx', 30000),
  file('src/views/SheetView.tsx', 9000),
  { path: 'src', type: 'tree', size: 0 },
  file('node_modules/react/index.js', 500),
  file('dist/assets/index.js', 300000),
  file('.git/config', 100),
];

describe('meaningfulFiles', () => {
  it('écarte les dossiers d’outillage et les dossiers cachés', () => {
    const paths = meaningfulFiles(TREE).map((f) => f.path);
    expect(paths).not.toContain('node_modules/react/index.js');
    expect(paths).not.toContain('dist/assets/index.js');
    expect(paths).not.toContain('.git/config');
  });

  it('ne garde que des fichiers, pas les entrées de dossier', () => {
    expect(meaningfulFiles(TREE).every((f) => f.type === 'blob')).toBe(true);
  });

  it('garde .github, qui décrit le projet', () => {
    const paths = meaningfulFiles([file('.github/workflows/ci.yml')]).map((f) => f.path);
    expect(paths).toEqual(['.github/workflows/ci.yml']);
  });
});

describe('groupByFolder', () => {
  it('met les fichiers de la racine dans leur propre groupe, en premier', () => {
    const groups = groupByFolder(meaningfulFiles(TREE));
    expect(groups[0].prefix).toBe('');
    expect(groups[0].files.map((f) => f.path)).toEqual(['README.md', 'package.json']);
  });

  it('éclate un dossier trop gros en ses sous-dossiers', () => {
    const groups = groupByFolder(meaningfulFiles(TREE));
    const prefixes = groups.map((g) => g.prefix);
    expect(prefixes).toContain('src/data/');
    expect(prefixes).toContain('src/lib/');
    expect(prefixes).toContain('src/views/');

    // Les fichiers posés directement dans src/ gardent leur propre groupe :
    // ils ne doivent ni disparaître ni se retrouver dans un sous-dossier.
    const direct = groups.find((g) => g.prefix === 'src/')!;
    expect(direct.files.map((f) => f.path)).toEqual(['src/App.tsx', 'src/main.tsx']);
  });

  it('garde un dossier modeste entier', () => {
    const small = [file('lib/a.ts'), file('lib/sub/b.ts')];
    expect(groupByFolder(small).map((g) => g.prefix)).toEqual(['lib/']);
  });

  it('ne descend pas indéfiniment', () => {
    const deep = Array.from({ length: 12 }, (_, i) => file(`a/b/c/d/e/f${i}.ts`));
    const prefixes = groupByFolder(deep).map((g) => g.prefix);
    expect(prefixes.every((p) => p.split('/').filter(Boolean).length <= 3)).toBe(true);
  });

  it('range les dossiers dans l’ordre alphabétique', () => {
    const groups = groupByFolder(meaningfulFiles(TREE)).map((g) => g.prefix).filter(Boolean);
    expect([...groups]).toEqual([...groups].sort((a, b) => a.localeCompare(b, 'fr')));
  });
});

describe('buildDomainsFromTree', () => {
  const domains = buildDomainsFromTree(TREE);

  it('n’attribue aucun statut : rien dans une arborescence n’en porte', () => {
    domains.forEach((d) => {
      d.features.forEach((f) => expect(f.status).toBeUndefined());
    });
  });

  it('annonce le poids de chaque élément', () => {
    const racine = domains.find((d) => d.name === 'racine')!;
    expect(racine.features.find((f) => f.name === 'README.md')?.meta).toBe('4,7 ko');
  });

  it('nomme les feuilles relativement à leur dossier', () => {
    const lib = domains.find((d) => d.name === 'src/lib')!;
    expect(lib.features.map((f) => f.name)).toContain('graph.ts');
    expect(lib.features.map((f) => f.name)).toContain('__tests__/graph.test.ts');
  });

  it('garde le chemin complet comme donnée vérifiable', () => {
    const lib = domains.find((d) => d.name === 'src/lib')!;
    const leaf = lib.features.find((f) => f.name === 'graph.ts')!;
    expect(leaf.files).toEqual(['src/lib/graph.ts']);
    expect(leaf.what).toBe('src/lib/graph.ts');
  });

  it('résume le compte et le poids du dossier', () => {
    const racine = domains.find((d) => d.name === 'racine')!;
    expect(racine.role).toBe('2 fichier(s) · 5,6 ko');
  });

  it('donne des clés et des numéros uniques', () => {
    const keys = domains.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('tronque un dossier démesuré en résumant le reste', () => {
    const big = Array.from({ length: 50 }, (_, i) => file(`gros/f${i}.ts`, 100));
    const [d] = buildDomainsFromTree(big);
    expect(d.features).toHaveLength(41);
    expect(d.features[40].name).toBe('… et 10 autre(s)');
    expect(d.features[40].meta).toBe('1,0 ko');
  });

  it('rend une liste vide sur un dépôt sans fichier lisible', () => {
    expect(buildDomainsFromTree([file('node_modules/x.js')])).toEqual([]);
  });

  it('décore les fichiers touchés récemment', () => {
    const activity = new Map([['src/lib/graph.ts', 'modifié, 42 ligne(s)']]);
    const withActivity = buildDomainsFromTree(TREE, { activity });
    const lib = withActivity.find((d) => d.name === 'src/lib')!;
    expect(lib.features.find((f) => f.name === 'graph.ts')?.meta).toBe('modifié, 42 ligne(s)');
    expect(lib.features.find((f) => f.name === 'url.ts')?.meta).toBe('3,0 ko');
  });
});

describe('activité git', () => {
  const commit = (sha: string, date: string): CommitInfo => ({
    sha,
    shortSha: sha.slice(0, 7),
    message: 'msg',
    author: 'moi',
    date,
    url: '',
  });

  it('prend la plage du plus ancien au plus récent commit chargé', () => {
    const w = windowFrom([
      commit('aaaaaaa1', '2026-09-21T10:00:00Z'),
      commit('bbbbbbb2', '2026-09-20T10:00:00Z'),
      commit('ccccccc3', '2026-09-19T10:00:00Z'),
    ]);
    expect(w).toEqual({
      base: 'ccccccc3',
      head: 'aaaaaaa1',
      commits: 3,
      since: '2026-09-19T10:00:00Z',
    });
  });

  it('ne compare rien quand il n’y a qu’un commit', () => {
    expect(windowFrom([commit('a', '2026-01-01T00:00:00Z')])).toBeNull();
    expect(windowFrom([])).toBeNull();
  });

  it.each([
    [{ path: 'a', status: 'added', changes: 12 }, 'ajouté, 12 ligne(s)'],
    [{ path: 'a', status: 'removed', changes: 0 }, 'supprimé'],
    [{ path: 'a', status: 'exotique', changes: 3 }, 'exotique, 3 ligne(s)'],
  ] as [ChangedFile, string][])('décrit %o', (file, expected) => {
    expect(describeChange(file)).toBe(expected);
  });

  it('indexe les constats par chemin', () => {
    const idx = activityIndex([
      { path: 'a.ts', status: 'modified', changes: 4 },
      { path: 'b.ts', status: 'added', changes: 9 },
    ]);
    expect(idx.get('a.ts')).toBe('modifié, 4 ligne(s)');
    expect(idx.size).toBe(2);
  });

  it('résume la fenêtre et classe les fichiers les plus remués', () => {
    const files: ChangedFile[] = [
      { path: 'petit.ts', status: 'modified', changes: 2 },
      { path: 'gros.ts', status: 'modified', changes: 200 },
      { path: 'moyen.ts', status: 'added', changes: 50 },
    ];
    const s = summarize(files, null);
    expect(s.touched).toBe(3);
    expect(s.lines).toBe(252);
    expect(s.busiest.map((b) => b.path)).toEqual(['gros.ts', 'moyen.ts', 'petit.ts']);
  });
});
