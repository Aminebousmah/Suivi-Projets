import { describe, expect, it } from 'vitest';
import type { Domain } from '../../data/types';
import { HANDLED, nextSelection, nodeId } from '../keyboard';

const domain = (key: string, feats: string[]): Domain => ({
  key,
  num: '01',
  name: key,
  tone: 'a',
  role: '',
  detail: '',
  features: feats.map((name) => ({ name, status: 'live' as const, what: '', files: [] })),
});

const DOMAINS = [domain('a', ['a1', 'a2', 'a3']), domain('b', ['b1']), domain('c', [])];
const at = (d: string | null, f: string | null = null) => ({ domain: d, feat: f });

describe('descendre et remonter', () => {
  it('entre dans le premier domaine depuis le projet', () => {
    expect(nextSelection(DOMAINS, at(null), 'ArrowRight')).toEqual(at('a'));
  });

  it('descend du domaine à sa première feuille', () => {
    expect(nextSelection(DOMAINS, at('a'), 'ArrowRight')).toEqual(at('a', 'a1'));
  });

  it('ne descend pas plus bas qu’une feuille', () => {
    expect(nextSelection(DOMAINS, at('a', 'a1'), 'ArrowRight')).toBeNull();
  });

  it('ne descend pas dans un domaine vide', () => {
    expect(nextSelection(DOMAINS, at('c'), 'ArrowRight')).toBeNull();
  });

  it('remonte de la feuille au domaine, puis au projet', () => {
    expect(nextSelection(DOMAINS, at('a', 'a2'), 'ArrowLeft')).toEqual(at('a'));
    expect(nextSelection(DOMAINS, at('a'), 'ArrowLeft')).toEqual(at(null));
    expect(nextSelection(DOMAINS, at(null), 'ArrowLeft')).toBeNull();
  });
});

describe('parcourir un niveau', () => {
  it('passe d’une feuille à la suivante', () => {
    expect(nextSelection(DOMAINS, at('a', 'a1'), 'ArrowDown')).toEqual(at('a', 'a2'));
    expect(nextSelection(DOMAINS, at('a', 'a3'), 'ArrowUp')).toEqual(at('a', 'a2'));
  });

  it('enjambe la frontière vers le domaine voisin', () => {
    expect(nextSelection(DOMAINS, at('a', 'a3'), 'ArrowDown')).toEqual(at('b', 'b1'));
    expect(nextSelection(DOMAINS, at('b', 'b1'), 'ArrowUp')).toEqual(at('a', 'a3'));
  });

  it('s’arrête à un domaine voisin sans feuille', () => {
    expect(nextSelection(DOMAINS, at('b', 'b1'), 'ArrowDown')).toEqual(at('c'));
  });

  it('ne sort pas de l’arbre par le bas ni par le haut', () => {
    expect(nextSelection(DOMAINS, at('c'), 'ArrowDown')).toBeNull();
    expect(nextSelection(DOMAINS, at('a'), 'ArrowUp')).toBeNull();
  });

  it('passe d’un domaine à l’autre quand aucune feuille n’est choisie', () => {
    expect(nextSelection(DOMAINS, at('a'), 'ArrowDown')).toEqual(at('b'));
    expect(nextSelection(DOMAINS, at('b'), 'ArrowUp')).toEqual(at('a'));
  });

  it('entre par le premier ou le dernier domaine depuis le projet', () => {
    expect(nextSelection(DOMAINS, at(null), 'ArrowDown')).toEqual(at('a'));
    expect(nextSelection(DOMAINS, at(null), 'ArrowUp')).toEqual(at('c'));
  });
});

describe('raccourcis', () => {
  it('Home et End sautent aux extrémités', () => {
    expect(nextSelection(DOMAINS, at('b', 'b1'), 'Home')).toEqual(at('a'));
    expect(nextSelection(DOMAINS, at('a'), 'End')).toEqual(at('c'));
  });

  it('Échap dégage d’un cran', () => {
    expect(nextSelection(DOMAINS, at('a', 'a1'), 'Escape')).toEqual(at('a'));
    expect(nextSelection(DOMAINS, at('a'), 'Escape')).toEqual(at(null));
    expect(nextSelection(DOMAINS, at(null), 'Escape')).toBeNull();
  });

  it('ignore les touches qui ne le concernent pas', () => {
    expect(nextSelection(DOMAINS, at('a'), 'x')).toBeNull();
    expect(nextSelection(DOMAINS, at('a'), 'Tab')).toBeNull();
    expect(HANDLED).not.toContain('Tab');
  });

  it('ne fait rien sur un arbre vide', () => {
    expect(nextSelection([], at(null), 'ArrowDown')).toBeNull();
  });

  it('repart du premier domaine quand la sélection n’existe plus', () => {
    expect(nextSelection(DOMAINS, at('disparu'), 'ArrowRight')).toEqual(at('a'));
  });
});

describe('nodeId', () => {
  it('nomme chaque niveau sans ambiguïté', () => {
    expect(nodeId(at(null))).toBe('noeud:projet');
    expect(nodeId(at('a'))).toBe('noeud:a');
    expect(nodeId(at('a', 'a1'))).toBe('noeud:a/a1');
  });
});
