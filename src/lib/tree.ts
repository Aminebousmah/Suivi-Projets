import type { Domain, Feature, ToneKey } from '../data/types';
import { formatSize } from './context';
import type { TreeEntry } from './github';

/**
 * Déduit des domaines de l'arborescence réelle d'un dépôt.
 *
 * Ce que produit ce module n'est pas une description fonctionnelle : ce sont
 * des dossiers et des fichiers. Aucun statut n'est attribué — rien dans une
 * arborescence ne dit qu'une chose est « en cours » ou « gelée ». Seuls des
 * faits sont portés : le poids, et l'activité récente quand elle est connue.
 */

/** Dossiers qu'on ne montre pas : ils disent le outillage, pas le projet. */
const IGNORED = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'vendor',
  '__pycache__',
  '.venv',
]);

/** Au-delà, un dossier est éclaté en ses sous-dossiers. */
const SPLIT_AT = 8;
/** Profondeur maximale de découpage, pour ne pas produire cent branches. */
const MAX_DEPTH = 3;
/** Au-delà, un domaine est tronqué et le reste est résumé en une ligne. */
const MAX_LEAVES = 40;

const TONES: ToneKey[] = ['a', 'b', 'c', 'd'];

function isHidden(segment: string): boolean {
  return segment.startsWith('.') && segment !== '.github';
}

/** Ne garde que les fichiers qu'un lecteur humain irait regarder. */
export function meaningfulFiles(entries: TreeEntry[]): TreeEntry[] {
  return entries.filter((e) => {
    if (e.type !== 'blob') return false;
    const parts = e.path.split('/');
    return !parts.some((p, i) => IGNORED.has(p) || (i < parts.length - 1 && isHidden(p)));
  });
}

interface Group {
  /** Chemin du dossier, vide pour la racine. */
  prefix: string;
  files: TreeEntry[];
}

/**
 * Regroupe les fichiers par dossier, en descendant d'un niveau tant qu'un
 * dossier est trop gros pour se lire d'un coup d'œil et qu'il a de quoi être
 * découpé. Un dépôt dont tout vit sous `src/` doit montrer `src/lib` et
 * `src/views`, pas un unique bloc « src ».
 */
export function groupByFolder(files: TreeEntry[], depth = 0, prefix = ''): Group[] {
  const direct: TreeEntry[] = [];
  const sub = new Map<string, TreeEntry[]>();

  files.forEach((f) => {
    const rest = f.path.slice(prefix.length);
    const slash = rest.indexOf('/');
    if (slash === -1) {
      direct.push(f);
      return;
    }
    const folder = rest.slice(0, slash);
    const list = sub.get(folder) ?? [];
    list.push(f);
    sub.set(folder, list);
  });

  const groups: Group[] = [];
  if (direct.length) groups.push({ prefix, files: direct });

  [...sub.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'fr'))
    .forEach(([folder, list]) => {
      const childPrefix = prefix + folder + '/';
      const splittable = list.some((f) => f.path.slice(childPrefix.length).includes('/'));
      if (list.length > SPLIT_AT && splittable && depth + 1 < MAX_DEPTH) {
        groups.push(...groupByFolder(list, depth + 1, childPrefix));
      } else {
        groups.push({ prefix: childPrefix, files: list });
      }
    });

  return groups;
}

export interface TreeOptions {
  /** Chemins touchés par l'activité git récente, avec leur résumé. */
  activity?: Map<string, string>;
}

/** Transforme un groupe de fichiers en domaine affichable. */
function toDomain(group: Group, index: number, options: TreeOptions): Domain {
  const bytes = group.files.reduce((a, f) => a + f.size, 0);
  const name = group.prefix ? group.prefix.replace(/\/$/, '') : 'racine';

  const sorted = [...group.files].sort((a, b) => a.path.localeCompare(b.path, 'fr'));
  const shown = sorted.slice(0, MAX_LEAVES);

  const features: Feature[] = shown.map((f) => {
    const touched = options.activity?.get(f.path);
    return {
      name: f.path.slice(group.prefix.length),
      what: f.path,
      files: [f.path],
      meta: touched ?? formatSize(f.size),
      notes: [
        `Chemin complet : ${f.path}`,
        `Poids : ${formatSize(f.size)}`,
        touched ? `Activité récente : ${touched}` : 'Aucune activité dans les derniers commits lus.',
      ],
    };
  });

  if (sorted.length > shown.length) {
    const rest = sorted.slice(MAX_LEAVES);
    features.push({
      name: `… et ${rest.length} autre(s)`,
      what: `${rest.length} fichiers supplémentaires dans ${name}`,
      files: [],
      meta: formatSize(rest.reduce((a, f) => a + f.size, 0)),
      notes: rest.slice(0, 20).map((f) => f.path),
    });
  }

  return {
    key: group.prefix || 'racine',
    num: String(index + 1).padStart(2, '0'),
    name,
    tone: TONES[index % TONES.length],
    role: `${group.files.length} fichier(s) · ${formatSize(bytes)}`,
    detail: `${group.files.length} fichier(s) · ${formatSize(bytes)}`,
    features,
  };
}

/** Domaines déduits d'une arborescence, dans l'ordre alphabétique des dossiers. */
export function buildDomainsFromTree(entries: TreeEntry[], options: TreeOptions = {}): Domain[] {
  const files = meaningfulFiles(entries);
  if (!files.length) return [];
  return groupByFolder(files).map((g, i) => toDomain(g, i, options));
}
