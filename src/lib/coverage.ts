import type { RepoData, Status } from '../data/types';
import type { TreeEntry } from './github';
import { meaningfulFiles } from './tree';
import type { MatchKind, RepoCheck } from './verify';
import { extractPath, resolvePath } from './verify';

/**
 * Croisement des deux arbres.
 *
 * L'arbre décrit dit ce que le projet fait et cite les fichiers censés le faire.
 * L'arbre réel dit ce que le dépôt contient. Les rapprocher répond à deux
 * questions qu'aucun des deux ne peut trancher seul : à quoi sert ce fichier, et
 * qu'est-ce que personne n'a pris la peine de décrire.
 *
 * Le rapprochement ne produit aucun jugement : un fichier que rien ne cite n'est
 * ni mort ni superflu — il est seulement non décrit.
 */

export interface FeatureRef {
  domainKey: string;
  domainName: string;
  feature: string;
  status?: Status;
  /** Comment le fichier a été rattaché : exactement, par un dossier, un motif… */
  kind: MatchKind;
}

export interface FolderCoverage {
  folder: string;
  files: number;
  described: number;
}

export interface Coverage {
  /** Chemin réel → fonctionnalités qui le citent. */
  byPath: Map<string, FeatureRef[]>;
  /** Fichiers réels qu'aucune fonctionnalité ne cite. */
  orphans: string[];
  total: number;
  described: number;
  byFolder: FolderCoverage[];
}

function folderOf(path: string): string {
  const cut = path.lastIndexOf('/');
  return cut === -1 ? 'racine' : path.slice(0, cut);
}

/** Rapproche les fichiers cités par les fonctionnalités et ceux du dépôt. */
export function buildCoverage(repo: RepoData, entries: TreeEntry[]): Coverage {
  const files = meaningfulFiles(entries);
  const paths = new Set(files.map((f) => f.path));
  const byPath = new Map<string, FeatureRef[]>();

  repo.domains.forEach((domain) => {
    domain.features.forEach((feature) => {
      // Une même fonctionnalité peut citer deux fois le même fichier, sous deux
      // déclarations différentes : elle ne doit y figurer qu'une fois.
      const seen = new Set<string>();

      feature.files.forEach((declared) => {
        const { kind, paths: matches } = resolvePath(declared, paths);
        matches.forEach((path) => {
          if (seen.has(path)) return;
          seen.add(path);
          const list = byPath.get(path) ?? [];
          list.push({
            domainKey: domain.key,
            domainName: domain.name,
            feature: feature.name,
            status: feature.status,
            kind,
          });
          byPath.set(path, list);
        });
      });
    });
  });

  const orphans = files.map((f) => f.path).filter((p) => !byPath.has(p));

  const folders = new Map<string, FolderCoverage>();
  files.forEach((f) => {
    const folder = folderOf(f.path);
    const entry = folders.get(folder) ?? { folder, files: 0, described: 0 };
    entry.files++;
    if (byPath.has(f.path)) entry.described++;
    folders.set(folder, entry);
  });

  return {
    byPath,
    orphans,
    total: files.length,
    described: files.length - orphans.length,
    byFolder: [...folders.values()].sort(
      (a, b) =>
        a.described / a.files - b.described / b.files ||
        b.files - a.files ||
        a.folder.localeCompare(b.folder, 'fr'),
    ),
  };
}

/** Ce qu'un fichier sert, en une ligne par fonctionnalité. */
export function describeRefs(refs: FeatureRef[] | undefined): string[] {
  if (!refs?.length) return ["Aucune fonctionnalité décrite ne cite ce fichier."];
  return refs.map((r) => `${r.domainName} → ${r.feature}`);
}

/** Part décrite d'un dossier, pour l'accoler à son décompte. */
export function folderNote(coverage: Coverage, folder: string): string | null {
  const entry = coverage.byFolder.find((f) => f.folder === folder);
  if (!entry) return null;
  return `${entry.described}/${entry.files} décrit(s)`;
}

/**
 * Ce que les chemins cités par une fonctionnalité donnent réellement dans le
 * dépôt, prêt à afficher.
 *
 * Le contrôle déduplique par chemin : deux fonctionnalités qui citent le même
 * fichier partagent un seul résultat, rangé sous une seule déclaration. La
 * correspondance se fait donc sur le chemin, jamais sur la déclaration brute.
 */
export function resolvedFor(
  check: RepoCheck | null,
  domainKey: string,
  files: string[],
): string[] {
  if (!check) return [];
  const wanted = new Set(files.map(extractPath));

  return (check.domains.find((d) => d.key === domainKey)?.checks ?? [])
    .filter((c) => wanted.has(c.path))
    .map((c) => `${c.kind} · ${c.matches.length ? c.matches.join(', ') : c.path}`);
}
