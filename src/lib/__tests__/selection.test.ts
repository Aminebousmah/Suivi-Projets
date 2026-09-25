import { describe, expect, it } from 'vitest';
import { REPOS } from '../../data/repos';
import {
  addedKey,
  buildCatalog,
  EMPTY_SELECTION,
  isShown,
  readSelection,
  repoFromGitHub,
  toggleDescribed,
  toggleRepo,
  writeSelection,
} from '../selection';

const POKE = { owner: 'Aminebousmah', name: 'PokeDungeon', branch: 'main', private: true, description: 'Un jeu', pushedAt: '' };

function memory(initial: string | null = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_: string, v: string) => {
      value = v;
    },
  };
}

describe('lecture et écriture de la sélection', () => {
  it('fait l’aller-retour par le stockage', () => {
    const storage = memory();
    const selection = { hidden: ['eleven'], added: [{ owner: 'a', name: 'b', branch: 'main' }] };
    writeSelection(selection, storage);
    expect(readSelection(storage)).toEqual(selection);
  });

  it('rend une sélection vide sur un stockage absent, refusé ou corrompu', () => {
    expect(readSelection(null)).toEqual(EMPTY_SELECTION);
    expect(readSelection(memory('pas du json'))).toEqual(EMPTY_SELECTION);
    expect(
      readSelection({
        getItem: () => {
          throw new Error('refusé');
        },
      }),
    ).toEqual(EMPTY_SELECTION);
  });

  it('écarte les entrées mal formées au lieu de tout jeter', () => {
    const raw = JSON.stringify({ hidden: ['sole', 3], added: [{ owner: 'a' }, { owner: 'a', name: 'b', branch: 'm' }] });
    expect(readSelection(memory(raw))).toEqual({
      hidden: ['sole'],
      added: [{ owner: 'a', name: 'b', branch: 'm' }],
    });
  });

  it('ne plante pas quand l’écriture est refusée', () => {
    const refusing = {
      setItem: () => {
        throw new Error('plein');
      },
    };
    expect(() => writeSelection(EMPTY_SELECTION, refusing)).not.toThrow();
  });
});

describe('catalogue', () => {
  it('montre tous les dépôts décrits par défaut', () => {
    const c = buildCatalog(REPOS, EMPTY_SELECTION);
    expect(c.visible).toEqual(Object.keys(REPOS));
  });

  it('masque un dépôt décrit sans le rendre injoignable', () => {
    const c = buildCatalog(REPOS, toggleDescribed(EMPTY_SELECTION, 'sole'));
    expect(c.visible).not.toContain('sole');
    expect(c.repos.sole).toBe(REPOS.sole);
  });

  it('ajoute un dépôt du compte, décrit par son seul nom', () => {
    const c = buildCatalog(REPOS, toggleRepo(REPOS, EMPTY_SELECTION, POKE));
    const key = addedKey(POKE);
    expect(c.visible.at(-1)).toBe(key);
    expect(c.repos[key]).toMatchObject({
      label: 'PokeDungeon',
      slug: 'Aminebousmah/PokeDungeon · main',
      tagline: 'Un jeu',
      domains: [],
    });
  });

  it('ne double pas un dépôt déjà décrit : cocher un dépôt décrit le montre', () => {
    const happicture = { ...POKE, name: 'Happicture' };
    const hidden = toggleDescribed(EMPTY_SELECTION, 'happicture');
    expect(isShown(REPOS, hidden, happicture)).toBe(false);
    const shown = toggleRepo(REPOS, hidden, happicture);
    expect(shown).toEqual(EMPTY_SELECTION);
    expect(isShown(REPOS, shown, happicture)).toBe(true);
  });

  it('retire un dépôt ajouté en le décochant', () => {
    const once = toggleRepo(REPOS, EMPTY_SELECTION, POKE);
    expect(isShown(REPOS, once, POKE)).toBe(true);
    expect(toggleRepo(REPOS, once, POKE).added).toEqual([]);
  });

  it('un dépôt ajouté n’invente rien : ni domaine, ni statut, ni suivi', () => {
    const repo = repoFromGitHub({ owner: 'o', name: 'n', branch: 'dev' });
    expect(repo.domains).toEqual([]);
    expect(repo.tracking).toEqual([]);
    expect(repo.phases).toEqual([]);
    expect(repo.stats).toEqual([]);
  });
});
