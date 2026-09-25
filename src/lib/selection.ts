import type { RepoData } from '../data/types';
import type { UserRepo } from './github';

/**
 * Les dépôts qu'Atlas montre : ceux décrits dans les données, moins ceux qu'on
 * a masqués, plus ceux qu'on a ajoutés depuis son compte GitHub. C'est une
 * préférence de ce navigateur, pas une donnée : sans stockage, on retombe sur
 * les dépôts décrits.
 */
export interface Selection {
  /** Clés des dépôts décrits qu'on ne veut plus voir dans la barre. */
  hidden: string[];
  /** Dépôts ajoutés depuis le compte, dans l'ordre d'ajout. */
  added: AddedRepo[];
}

export interface AddedRepo {
  owner: string;
  name: string;
  branch: string;
  description?: string | null;
}

export const EMPTY_SELECTION: Selection = { hidden: [], added: [] };

const KEY = 'atlas.selection';

/** Relit la sélection ; un stockage refusé ou corrompu rend la sélection vide. */
export function readSelection(storage: Pick<Storage, 'getItem'> | null = safeStorage()): Selection {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return EMPTY_SELECTION;
    const parsed = JSON.parse(raw) as Partial<Selection>;
    const hidden = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((k): k is string => typeof k === 'string')
      : [];
    const added = Array.isArray(parsed.added)
      ? parsed.added.filter(
          (r): r is AddedRepo =>
            !!r &&
            typeof r.owner === 'string' &&
            typeof r.name === 'string' &&
            typeof r.branch === 'string',
        )
      : [];
    return { hidden, added };
  } catch {
    return EMPTY_SELECTION;
  }
}

/** Enregistre la sélection ; un refus du stockage la limite à cette visite. */
export function writeSelection(
  selection: Selection,
  storage: Pick<Storage, 'setItem'> | null = safeStorage(),
): void {
  try {
    storage?.setItem(KEY, JSON.stringify(selection));
  } catch {
    /* stockage refusé ou plein : la sélection vaut pour cette visite */
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** La clé d'un dépôt ajouté : son chemin GitHub, en minuscules. */
export function addedKey(r: { owner: string; name: string }): string {
  return `${r.owner}/${r.name}`.toLowerCase();
}

/** Le chemin GitHub d'un dépôt décrit, lu dans son slug. */
function slugPath(repo: RepoData): string {
  return repo.slug.split('·')[0].trim().toLowerCase();
}

/**
 * Un dépôt ajouté n'a pas de description écrite : seulement son nom et sa
 * branche. Tout le reste — arbre, suivi, règles, phases, couleurs — vient de
 * son atlas.md une fois lu.
 */
export function repoFromGitHub(r: AddedRepo): RepoData {
  return {
    label: r.name,
    slug: `${r.owner}/${r.name} · ${r.branch}`,
    titleA: '',
    titleB: r.name,
    tagline: r.description ?? '',
    stats: [],
    does: [],
    todo: [],
    stack: [],
    tracking: [],
    domains: [],
    goldenRule: '',
    hubName: r.name,
    hubUnit: 'fonctionnalités',
    sessions: [],
    memories: [],
    ctxFiles: [],
    ctxRules: [],
    ctxNever: [],
    ctxOpen: [],
    phases: [],
  };
}

export interface Catalog {
  /** Tous les dépôts connus, masqués compris : une URL qui en vise un s'ouvre. */
  repos: Record<string, RepoData>;
  /** Ceux de la barre, dans l'ordre : décrits d'abord, ajoutés ensuite. */
  visible: string[];
}

/** Assemble les dépôts décrits et la sélection de ce navigateur. */
export function buildCatalog(described: Record<string, RepoData>, selection: Selection): Catalog {
  const repos: Record<string, RepoData> = { ...described };
  const known = new Set(Object.values(described).map(slugPath));
  const visible = Object.keys(described).filter((k) => !selection.hidden.includes(k));

  selection.added.forEach((r) => {
    const key = addedKey(r);
    // Un dépôt déjà décrit ne s'ajoute pas une seconde fois : on l'affiche.
    if (known.has(key) || repos[key]) return;
    repos[key] = repoFromGitHub(r);
    visible.push(key);
  });

  return { repos, visible };
}

/** Le dépôt décrit qui correspond à un dépôt du compte, s'il y en a un. */
export function describedKeyOf(
  described: Record<string, RepoData>,
  r: { owner: string; name: string },
): string | null {
  const path = addedKey(r);
  return Object.keys(described).find((k) => slugPath(described[k]) === path) ?? null;
}

/** Montre ou masque un dépôt de la barre, qu'il soit décrit ou issu du compte. */
export function toggleRepo(
  described: Record<string, RepoData>,
  selection: Selection,
  r: UserRepo | AddedRepo,
): Selection {
  const describedKey = describedKeyOf(described, r);
  if (describedKey) return toggleDescribed(selection, describedKey);

  const key = addedKey(r);
  const present = selection.added.some((a) => addedKey(a) === key);
  return {
    ...selection,
    added: present
      ? selection.added.filter((a) => addedKey(a) !== key)
      : [
          ...selection.added,
          { owner: r.owner, name: r.name, branch: r.branch, description: r.description ?? null },
        ],
  };
}

/** Montre ou masque un dépôt décrit. */
export function toggleDescribed(selection: Selection, key: string): Selection {
  return {
    ...selection,
    hidden: selection.hidden.includes(key)
      ? selection.hidden.filter((k) => k !== key)
      : [...selection.hidden, key],
  };
}

/** Vrai quand un dépôt du compte figure dans la barre. */
export function isShown(
  described: Record<string, RepoData>,
  selection: Selection,
  r: { owner: string; name: string },
): boolean {
  const describedKey = describedKeyOf(described, r);
  if (describedKey) return !selection.hidden.includes(describedKey);
  return selection.added.some((a) => addedKey(a) === addedKey(r));
}
