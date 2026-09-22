import type { ChangedFile, CommitInfo } from './github';

/**
 * Activité git récente, telle qu'elle se lit dans les commits déjà chargés.
 *
 * On ne déduit aucun statut de cette activité : un fichier modifié hier n'est
 * pas « en cours », un fichier ancien n'est pas « gelé ». Ce module ne produit
 * que des constats datés, à afficher tels quels.
 */

const STATUS_FR: Record<string, string> = {
  added: 'ajouté',
  modified: 'modifié',
  removed: 'supprimé',
  renamed: 'renommé',
  copied: 'copié',
  changed: 'modifié',
  unchanged: 'inchangé',
};

export interface ActivityWindow {
  /** Commit le plus ancien de la fenêtre observée. */
  base: string;
  /** Commit le plus récent. */
  head: string;
  /** Nombre de commits couverts. */
  commits: number;
  /** Date du commit le plus ancien de la fenêtre. */
  since: string;
}

/** Détermine la plage à comparer depuis les commits déjà chargés. */
export function windowFrom(commits: CommitInfo[]): ActivityWindow | null {
  if (commits.length < 2) return null;
  const head = commits[0];
  const base = commits[commits.length - 1];
  return { base: base.sha, head: head.sha, commits: commits.length, since: base.date };
}

/** Rend le constat lisible : « modifié, 42 lignes ». */
export function describeChange(file: ChangedFile): string {
  const verb = STATUS_FR[file.status] ?? file.status;
  return file.changes > 0 ? `${verb}, ${file.changes} ligne(s)` : verb;
}

/** Index chemin → constat, prêt à décorer l'arborescence. */
export function activityIndex(files: ChangedFile[]): Map<string, string> {
  const map = new Map<string, string>();
  files.forEach((f) => map.set(f.path, describeChange(f)));
  return map;
}

export interface ActivitySummary {
  window: ActivityWindow | null;
  touched: number;
  lines: number;
  /** Les chemins les plus remués de la fenêtre, du plus au moins. */
  busiest: { path: string; changes: number }[];
}

export function summarize(
  files: ChangedFile[],
  window: ActivityWindow | null,
): ActivitySummary {
  return {
    window,
    touched: files.length,
    lines: files.reduce((a, f) => a + f.changes, 0),
    busiest: [...files]
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 5)
      .map((f) => ({ path: f.path, changes: f.changes })),
  };
}
