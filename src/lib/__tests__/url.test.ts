import { describe, expect, it } from 'vitest';
import { REPOS } from '../../data/repos';
import { buildSearch, DEFAULTS, parseState, reduceState } from '../url';

const firstDomain = REPOS.sole.domains[0];
const firstFeat = firstDomain.features[0];

describe('parseState', () => {
  it('rend les valeurs par défaut sur une URL nue', () => {
    expect(parseState('')).toEqual(DEFAULTS);
  });

  it('relit un état complet', () => {
    const s = parseState(
      `?repo=sole&view=arch&viz=list&domain=${firstDomain.key}` +
        `&feat=${encodeURIComponent(firstFeat.name)}&zoom=0.85`,
    );
    expect(s).toEqual({
      repo: 'sole',
      view: 'arch',
      viz: 'list',
      src: 'described',
      domain: firstDomain.key,
      feat: firstFeat.name,
      zoom: 0.85,
    });
  });

  it('ignore un dépôt, une vue ou un zoom inconnus', () => {
    const s = parseState('?repo=neant&view=nulle&viz=autre&zoom=42');
    expect(s.repo).toBe(DEFAULTS.repo);
    expect(s.view).toBe(DEFAULTS.view);
    expect(s.viz).toBe(DEFAULTS.viz);
    expect(s.zoom).toBe(DEFAULTS.zoom);
  });

  it("oublie une fonctionnalité qui n'appartient pas au domaine visé", () => {
    const s = parseState(`?domain=${firstDomain.key}&feat=inexistante`);
    expect(s.domain).toBe(firstDomain.key);
    expect(s.feat).toBeNull();
  });

  it('oublie la sélection entière si le domaine est inconnu', () => {
    const s = parseState(`?domain=neant&feat=${encodeURIComponent(firstFeat.name)}`);
    expect(s.domain).toBeNull();
    expect(s.feat).toBeNull();
  });
});

describe('buildSearch', () => {
  it("n'écrit rien quand tout vaut le défaut", () => {
    expect(buildSearch(DEFAULTS)).toBe('');
  });

  it('fait un aller-retour fidèle', () => {
    const s = {
      repo: 'eleven',
      view: 'arch' as const,
      viz: 'list' as const,
      src: 'described' as const,
      domain: REPOS.eleven.domains[1].key,
      feat: REPOS.eleven.domains[1].features[0].name,
      zoom: 1.15,
    };
    expect(parseState(buildSearch(s))).toEqual(s);
  });

  it('omet les paramètres restés au défaut', () => {
    const search = buildSearch({ ...DEFAULTS, view: 'progress' });
    expect(search).toBe('?view=progress');
  });
});

describe('source de l’arbre', () => {
  it('relit la source dans l’URL et ignore une valeur inconnue', () => {
    expect(parseState('?src=repo').src).toBe('repo');
    expect(parseState('?src=néant').src).toBe('described');
  });

  it('n’écrit la source que lorsqu’elle change', () => {
    expect(buildSearch({ ...DEFAULTS, src: 'described' })).toBe('');
    expect(buildSearch({ ...DEFAULTS, src: 'repo' })).toBe('?src=repo');
  });

  it('garde la sélection de l’arbre du dépôt, dont les clés lui sont propres', () => {
    const next = reduceState(
      { ...DEFAULTS, src: 'repo' },
      { domain: 'src/lib/', feat: 'graph.ts' },
    );
    expect(next).toMatchObject({ domain: 'src/lib/', feat: 'graph.ts' });
  });

  it('vide la sélection en changeant de source', () => {
    const prev = { ...DEFAULTS, src: 'repo' as const, domain: 'src/lib/', feat: 'graph.ts' };
    expect(reduceState(prev, { src: 'described' })).toMatchObject({
      domain: null,
      feat: null,
    });
  });
});

describe('reduceState', () => {
  it('vide la sélection en changeant de dépôt', () => {
    const prev = { ...DEFAULTS, domain: firstDomain.key, feat: firstFeat.name };
    expect(reduceState(prev, { repo: 'eleven' })).toMatchObject({
      repo: 'eleven',
      domain: null,
      feat: null,
    });
  });

  it('vide la fonctionnalité en changeant de domaine', () => {
    const prev = { ...DEFAULTS, domain: firstDomain.key, feat: firstFeat.name };
    const next = reduceState(prev, { domain: REPOS.sole.domains[1].key });
    expect(next.feat).toBeNull();
  });

  it('garde la fonctionnalité quand elle reste valide', () => {
    const prev = { ...DEFAULTS, domain: firstDomain.key, feat: firstFeat.name };
    expect(reduceState(prev, { view: 'arch' }).feat).toBe(firstFeat.name);
  });

  it('accepte domaine et fonctionnalité posés ensemble', () => {
    const next = reduceState(DEFAULTS, { domain: firstDomain.key, feat: firstFeat.name });
    expect(next).toMatchObject({ domain: firstDomain.key, feat: firstFeat.name });
  });
});
