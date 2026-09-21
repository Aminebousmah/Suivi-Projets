import type { RepoData } from '../data/types';
import type { TreeEntry } from './github';

export type MatchKind = 'exact' | 'partiel' | 'dossier' | 'motif' | 'déplacé' | 'absent';

export interface FileCheck {
  /** La déclaration brute, annotation comprise : « src/config/nav.ts — doors[] ». */
  declared: string;
  /** Le chemin qu'on en extrait. */
  path: string;
  kind: MatchKind;
  /** Chemins réels du dépôt qui correspondent, au plus trois. */
  matches: string[];
}

export interface DomainCheck {
  key: string;
  name: string;
  checks: FileCheck[];
  missing: number;
}

export interface RepoCheck {
  domains: DomainCheck[];
  total: number;
  resolved: number;
  missing: number;
}

/** Retire l'annotation « — … » et les espaces qui traînent. */
export function extractPath(declared: string): string {
  return declared.split('—')[0].trim();
}

/**
 * Confronte un chemin déclaré à l'arborescence réelle.
 *
 * Les déclarations de la maquette sont écrites pour un lecteur humain : elles
 * omettent parfois le préfixe `src/`, désignent un dossier entier, ou portent un
 * caractère générique. On accepte donc, dans l'ordre : l'égalité, le dossier, le
 * motif, le suffixe de chemin, puis le simple nom de fichier — ce dernier cas
 * signalant un fichier déplacé plutôt que retrouvé.
 */
export function checkPath(declared: string, paths: Set<string>): FileCheck {
  const path = extractPath(declared);
  const all = [...paths];
  const hit = (kind: MatchKind, matches: string[]): FileCheck => ({
    declared,
    path,
    kind,
    matches: matches.slice(0, 3),
  });

  if (paths.has(path)) return hit('exact', [path]);

  if (path.endsWith('/')) {
    const inside = all.filter((p) => p.startsWith(path));
    if (inside.length) return hit('dossier', inside);
    const loose = all.filter((p) => p.includes('/' + path));
    if (loose.length) return hit('dossier', loose);
  }

  if (path.includes('*')) {
    const prefix = path.slice(0, path.indexOf('*'));
    const under = all.filter((p) => p.startsWith(prefix) || p.includes('/' + prefix));
    if (under.length) return hit('motif', under);
  }

  const bySuffix = all.filter((p) => p === path || p.endsWith('/' + path));
  if (bySuffix.length) return hit('partiel', bySuffix);

  const name = path.split('/').pop() ?? path;
  if (name && name !== path) {
    const byName = all.filter((p) => p.endsWith('/' + name) || p === name);
    if (byName.length) return hit('déplacé', byName);
  }

  return hit('absent', []);
}

/** Vrai dès qu'un chemin réel du dépôt a été trouvé pour la déclaration. */
export function isResolved(kind: MatchKind): boolean {
  return kind !== 'absent';
}

/**
 * Passe en revue tous les fichiers cités par les fonctionnalités d'un dépôt.
 * C'est le seul croisement qui dise la vérité : les données décrivent ce que le
 * projet est censé contenir, l'arborescence dit ce qu'il contient vraiment.
 */
export function checkRepo(repo: RepoData, entries: TreeEntry[]): RepoCheck {
  const paths = new Set(entries.map((e) => e.path));
  let total = 0;
  let resolved = 0;

  const domains = repo.domains.map((d) => {
    const seen = new Set<string>();
    const checks: FileCheck[] = [];

    d.features.forEach((f) => {
      f.files.forEach((decl) => {
        // Deux fonctionnalités citent souvent le même fichier avec des
        // annotations différentes : c'est le chemin qui fait l'unicité.
        const path = extractPath(decl);
        if (seen.has(path)) return;
        seen.add(path);
        const check = checkPath(decl, paths);
        checks.push(check);
        total++;
        if (isResolved(check.kind)) resolved++;
      });
    });

    return {
      key: d.key,
      name: d.name,
      checks,
      missing: checks.filter((c) => !isResolved(c.kind)).length,
    };
  });

  return { domains, total, resolved, missing: total - resolved };
}
