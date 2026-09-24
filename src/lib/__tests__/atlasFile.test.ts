import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { alignDomainKeys, parseAtlasFile, tableRows } from '../atlasFile';
import { REPOS } from '../../data/repos';
import type { TextFile } from '../github';

const file = (text: string, path = 'atlas.md'): TextFile => ({
  path,
  text,
  bytes: text.length,
});

const FIXTURE = file(readFileSync(join(__dirname, 'fixtures', 'atlas.md'), 'utf8'));

describe('parseAtlasFile', () => {
  const doc = parseAtlasFile(FIXTURE)!;

  it('lit le titre et la phrase de présentation', () => {
    expect(doc.title).toBe('Atlas — Encyclopédie du citron');
    expect(doc.tagline).toBe('Site éditorial consacré au citron, en production depuis mars.');
  });

  it('lit les domaines et leur rôle', () => {
    expect(doc.domains.map((d) => d.name)).toEqual([
      'Navigation & parcours',
      'Contenu éditorial',
    ]);
    expect(doc.domains[0].role).toBe("L'ossature de circulation : menu, portes, pied de page.");
    expect(doc.domains.map((d) => d.num)).toEqual(['01', '02']);
  });

  it('donne à chaque domaine une clé utilisable dans une URL', () => {
    expect(doc.domains.map((d) => d.key)).toEqual(['navigation-parcours', 'contenu-éditorial']);
  });

  it('range les fonctionnalités sous leur domaine', () => {
    expect(doc.domains[0].features.map((f) => f.name)).toEqual([
      'Les 10 portes thématiques',
      'Recherche plein texte',
      "Fil d'ariane",
    ]);
    expect(doc.domains[1].features).toHaveLength(2);
  });

  it('lit les quatre statuts, y compris en emoji', () => {
    const [nav, edito] = doc.domains;
    expect(nav.features.map((f) => f.status)).toEqual(['live', 'wip', 'idea']);
    expect(edito.features.map((f) => f.status)).toEqual(['live', 'frozen']);
  });

  it('retire le marqueur de statut du nom affiché', () => {
    expect(doc.domains[0].features[2].name).toBe("Fil d'ariane");
    expect(doc.domains[1].features[1].name).toBe('Comparateur de variétés');
  });

  it('retient ce que fait chaque fonctionnalité, ses fichiers et ses notes', () => {
    const portes = doc.domains[0].features[0];
    expect(portes.what).toBe("Grille d'entrée vers les dix univers du citron.");
    expect(portes.files).toEqual([
      'src/config/nav.ts',
      'src/components/sections/TenDoors.astro',
    ]);
    expect(portes.notes).toEqual([
      'La porte Boutique disparaît quand le commerce est coupé.',
      'Chaque porte porte un numéro et un sous-titre.',
    ]);
  });

  it('ne mutile pas un chemin qui contient des tirets bas', () => {
    // Markdown lit __tests__ comme du gras : un chemin entre accents graves
    // doit traverser la lecture intact.
    expect(doc.domains[0].features[1].files).toEqual([
      'src/pages/api/search.json.ts',
      'src/__tests__/search.test.ts',
      'un chemin sans accents graves.ts',
    ]);
  });

  it('accepte une fonctionnalité sans fichier ni note', () => {
    const fil = doc.domains[0].features[2];
    expect(fil.files).toEqual([]);
    expect(fil.notes).toEqual([]);
    expect(fil.what).toBe('Chemin de navigation sur les pages profondes.');
  });

  it('lit la feuille de suivi', () => {
    expect(doc.tracking).toHaveLength(4);
    expect(doc.tracking[0]).toEqual({
      k: 'Pages générées',
      v: '131',
      target: '—',
      pct: '100%',
      tone: 'live',
    });
    expect(doc.tracking[1].tone).toBe('wip');
    expect(doc.tracking[2].tone).toBe('frozen');
  });

  it('ne se casse pas sur un avancement qui n’est pas un pourcentage', () => {
    expect(doc.tracking[3]).toMatchObject({ pct: '0%', tone: 'idea' });
  });

  it('lit ce qui est fait et ce qui reste', () => {
    expect(doc.does).toHaveLength(2);
    expect(doc.todo[0]).toBe("Activer l'aile marchande.");
  });

  it('rend null quand aucun domaine n’est décrit', () => {
    expect(parseAtlasFile(file('# Titre\n\nUn texte, et rien d’autre.'))).toBeNull();
    expect(parseAtlasFile(file(''))).toBeNull();
  });

  it('ignore une section qui n’est pas un domaine', () => {
    const doc2 = parseAtlasFile(
      file('# T\n\n## Notes de version\n### Pas une fonctionnalité — en ligne\n\n## Domaine · Vrai\n### Une — en ligne'),
    )!;
    expect(doc2.domains.map((d) => d.name)).toEqual(['Vrai']);
  });

  it('retombe sur « idée » quand le statut est absent ou inconnu', () => {
    const doc2 = parseAtlasFile(file('# T\n\n## Domaine · D\n### Sans statut\n### Autre — bizarre'))!;
    expect(doc2.domains[0].features.map((f) => f.status)).toEqual(['idea', 'idea']);
  });
});

describe('tableRows', () => {
  it('écarte la ligne de séparation', () => {
    const rows = tableRows(['| a | b |', '| --- | --- |', '| 1 | 2 |']);
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('ignore ce qui n’est pas une ligne de tableau', () => {
    expect(tableRows(['du texte', '| a |', ''])).toEqual([['a']]);
  });
});

describe('alignDomainKeys', () => {
  const reference = REPOS.atlas.domains;

  it('reprend la clé du domaine décrit qui porte le même nom', () => {
    const live = [{ ...reference[0], key: 'coque-et-navigation', name: `  ${reference[0].name.toUpperCase()} ` }];
    expect(alignDomainKeys(live, reference)[0].key).toBe(reference[0].key);
  });

  it('laisse sa clé à un domaine que les données ne connaissent pas', () => {
    const live = [{ ...reference[0], key: 'nouveau', name: 'Nouveau domaine' }];
    expect(alignDomainKeys(live, reference)[0]).toBe(live[0]);
    expect(alignDomainKeys(live, [])[0]).toBe(live[0]);
  });

  it("retrouve les clés d'Atlas dans son propre atlas.md", () => {
    const text = readFileSync('atlas.md', 'utf8');
    const doc = parseAtlasFile({ path: 'atlas.md', text, bytes: text.length });
    const keys = alignDomainKeys(doc!.domains, reference).map((d) => d.key);
    expect(keys).toEqual(reference.map((d) => d.key));
  });
});
