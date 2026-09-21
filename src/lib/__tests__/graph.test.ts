import { describe, expect, it } from 'vitest';
import { REPOS } from '../../data/repos';
import { THEMES } from '../../data/themes';
import type { Domain } from '../../data/types';
import { buildMap, buildOverview } from '../graph';

const t = THEMES.sole;

function domain(key: string, statuses: Domain['features'][number]['status'][]): Domain {
  return {
    key,
    num: '01',
    name: 'Domaine ' + key,
    tone: 'a',
    role: 'role',
    detail: 'detail',
    features: statuses.map((status, i) => ({
      name: key + '-f' + i,
      status,
      what: 'what',
      files: ['a.ts'],
    })),
  };
}

describe('buildMap', () => {
  it('place une feuille par fonctionnalité et une carte par domaine', () => {
    const domains = [domain('a', ['live', 'wip']), domain('b', ['idea'])];
    const map = buildMap(domains, t, null, null);

    expect(map.mapDomains).toHaveLength(2);
    expect(map.mapLeaves).toHaveLength(3);
    expect(map.mapLeaves.map((l) => l.name)).toEqual(['a-f0', 'a-f1', 'b-f0']);
  });

  it('trace une arête par feuille plus une par domaine', () => {
    const domains = [domain('a', ['live', 'wip']), domain('b', ['idea'])];
    const map = buildMap(domains, t, null, null);

    expect(map.mapEdges).toHaveLength(3 + 2);
    expect(map.mapEdges.every((e) => e.d.startsWith('M'))).toBe(true);
  });

  it("ancre les arêtes racine au centre vertical du canvas", () => {
    const domains = [domain('a', ['live', 'live', 'live']), domain('b', ['idea'])];
    const map = buildMap(domains, t, null, null);
    const rootCy = parseFloat(map.canvasH) / 2;

    const rootEdges = map.mapEdges.filter((e) => e.key.startsWith('root:'));
    expect(rootEdges).toHaveLength(2);
    rootEdges.forEach((e) => {
      expect(e.d).toMatch(new RegExp('^M\\S+ ' + rootCy + ' C'));
    });
  });

  it('met en avant la feuille sélectionnée et son arête', () => {
    const domains = [domain('a', ['live', 'wip'])];
    const map = buildMap(domains, t, 'a', 'a-f1');

    const on = map.mapLeaves.find((l) => l.name === 'a-f1')!;
    const off = map.mapLeaves.find((l) => l.name === 'a-f0')!;
    expect(on.bg).toBe(t.tones.a.bg);
    expect(off.bg).toBe(t.surfaceAlt);

    const edge = map.mapEdges.find((e) => e.key === 'leaf:a/a-f1')!;
    expect(edge.w).toBeGreaterThan(2);
  });

  it('cercle le domaine sélectionné', () => {
    const domains = [domain('a', ['live']), domain('b', ['live'])];
    const map = buildMap(domains, t, 'b', null);

    expect(map.mapDomains.find((d) => d.key === 'a')!.ring).toBe('none');
    expect(map.mapDomains.find((d) => d.key === 'b')!.ring).toContain('0 0 0 3px');
  });

  it('empile les blocs sans chevauchement', () => {
    const domains = [domain('a', ['live', 'live']), domain('b', ['live'])];
    const map = buildMap(domains, t, null, null);
    const tops = map.mapLeaves.map((l) => parseFloat(l.top));

    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    }
    expect(parseFloat(map.canvasH)).toBeGreaterThan(tops[tops.length - 1]);
  });

  it('donne des clés uniques à chaque nœud et arête', () => {
    const map = buildMap(REPOS.sole.domains, t, null, null);
    const keys = [
      ...map.mapLeaves.map((l) => l.key),
      ...map.mapDomains.map((d) => d.key),
      ...map.mapEdges.map((e) => e.key),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('buildOverview', () => {
  it("passe un domaine en développement dès qu'une fonctionnalité est en cours", () => {
    const { overview } = buildOverview([domain('a', ['live', 'wip', 'idea'])], t, null);
    expect(overview[0].state).toBe('en développement');
  });

  it('marque terminée une branche entièrement en ligne', () => {
    const { overview } = buildOverview([domain('a', ['live', 'live'])], t, null);
    expect(overview[0].state).toBe('terminée');
  });

  it('marque gelée une branche sans rien en ligne ni en cours', () => {
    const { overview } = buildOverview([domain('a', ['frozen', 'idea'])], t, null);
    expect(overview[0].state).toBe('gelée');
  });

  it('marque partielle une branche à majorité en ligne mais incomplète', () => {
    const { overview } = buildOverview([domain('a', ['live', 'live', 'idea'])], t, null);
    expect(overview[0].state).toBe('partielle');
  });

  it('répartit les segments au prorata et à 100 % au total', () => {
    const { overview } = buildOverview([domain('a', ['live', 'live', 'idea', 'frozen'])], t, null);
    const segs = overview[0].segs;
    expect(segs.map((s) => s.w)).toEqual(['50%', '25%', '25%']);
    expect(segs.map((s) => s.label)).toEqual(['2 en ligne', '1 gelée', '1 idée']);
  });

  it('agrège le décompte projet sur tous les domaines', () => {
    const { projectCounts, projectSegs } = buildOverview(
      [domain('a', ['live', 'wip']), domain('b', ['live'])],
      t,
      null,
    );
    expect(projectCounts).toBe('2 en ligne · 1 en cours');
    const total = projectSegs.reduce((a, s) => a + parseFloat(s.w), 0);
    expect(total).toBeCloseTo(100, 6);
  });

  it('surligne la ligne du domaine sélectionné', () => {
    const { overview } = buildOverview([domain('a', ['live']), domain('b', ['live'])], t, 'a');
    expect(overview[0].rowBg).toBe(t.surfaceAlt);
    expect(overview[1].rowBg).toBe('transparent');
  });
});

describe('données des dépôts', () => {
  it.each(Object.keys(REPOS))('%s : chaque fonctionnalité a un statut connu', (key) => {
    const known = ['live', 'wip', 'frozen', 'idea'];
    REPOS[key].domains.forEach((d) => {
      d.features.forEach((f) => {
        expect(known).toContain(f.status);
      });
    });
  });

  it.each(Object.keys(REPOS))('%s : les clés de domaine sont uniques', (key) => {
    const keys = REPOS[key].domains.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(Object.keys(REPOS))('%s : un thème existe pour le dépôt', (key) => {
    expect(THEMES[key]).toBeDefined();
    REPOS[key].domains.forEach((d) => {
      expect(THEMES[key].tones[d.tone]).toBeDefined();
    });
  });

  it.each(Object.keys(REPOS))('%s : les statistiques annoncent le bon nombre de fonctions', (key) => {
    const total = REPOS[key].domains.reduce((a, d) => a + d.features.length, 0);
    const stat = REPOS[key].stats.find((s) => s.k === 'fonctions');
    if (stat) expect(Number(stat.v)).toBe(total);
    expect(total).toBeGreaterThan(0);
  });
});
