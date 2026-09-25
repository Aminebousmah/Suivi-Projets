import { REPOS } from '../data/repos';
import { VIEWS } from '../data/labels';
import type { Domain, TreeSource, ViewId, VizMode } from '../data/types';

export const ZOOM_STEPS = [0.45, 0.62, 0.85, 1.15];

export const DEFAULTS = {
  repo: 'sole',
  view: 'sheet' as ViewId,
  viz: 'graph' as VizMode,
  src: 'described' as TreeSource,
  domain: null as string | null,
  feat: null as string | null,
  zoom: 0.62,
};

export interface AtlasState {
  repo: string;
  view: ViewId;
  viz: VizMode;
  /** L'arbre montre la description écrite, ou l'arborescence du dépôt. */
  src: TreeSource;
  domain: string | null;
  feat: string | null;
  zoom: number;
}

/**
 * Les domaines contre lesquels une sélection se vérifie, ou `null` quand rien ne
 * permet de la vérifier : l'arbre du dépôt a ses propres clés, et un dépôt décrit
 * seulement par son atlas.md n'a pas de domaine connu avant qu'on l'ait lu.
 */
export type DomainsOf = (repo: string, src: TreeSource) => Domain[] | null;

/** Les domaines écrits dans les données, quand il y en a. */
export const staticDomains: DomainsOf = (repo, src) => {
  if (src === 'repo') return null;
  const domains = REPOS[repo]?.domains ?? [];
  return domains.length ? domains : null;
};

/**
 * Lit un état complet depuis une query string, en retombant sur les valeurs par
 * défaut dès qu'un paramètre ne correspond à rien de connu — une URL trafiquée
 * ouvre l'application, elle ne la casse pas.
 */
export function parseState(
  search: string,
  domainsOf: DomainsOf = staticDomains,
  repoKeys: string[] = Object.keys(REPOS),
  fallback: string = DEFAULTS.repo,
): AtlasState {
  const q = new URLSearchParams(search);

  // Un dépôt masqué reste joignable par son URL ; un dépôt inconnu retombe sur
  // le premier de la barre.
  const repo = q.get('repo');
  const safeRepo = repo && repoKeys.includes(repo) ? repo : fallback;

  const view = q.get('view');
  const safeView = VIEWS.some((v) => v.id === view) ? (view as ViewId) : DEFAULTS.view;

  const viz = q.get('viz');
  const safeViz: VizMode = viz === 'graph' || viz === 'list' ? viz : DEFAULTS.viz;

  const src = q.get('src');
  const safeSrc: TreeSource = src === 'repo' ? 'repo' : DEFAULTS.src;

  const domainKey = q.get('domain');
  const featName = q.get('feat');
  const known = domainsOf(safeRepo, safeSrc);
  let domain: string | null = domainKey;
  let feat: string | null = domainKey ? featName : null;
  if (known) {
    const found = known.find((d) => d.key === domainKey);
    domain = found ? found.key : null;
    feat = found?.features.find((f) => f.name === featName)?.name ?? null;
  }

  const rawZoom = Number(q.get('zoom'));
  const zoom = ZOOM_STEPS.find((z) => Math.abs(z - rawZoom) < 0.001) ?? DEFAULTS.zoom;

  return {
    repo: safeRepo,
    view: safeView,
    viz: safeViz,
    src: safeSrc,
    domain,
    feat,
    zoom,
  };
}

/** Sérialise l'état en query string, en omettant tout ce qui vaut le défaut. */
export function buildSearch(s: AtlasState): string {
  const q = new URLSearchParams();
  if (s.repo !== DEFAULTS.repo) q.set('repo', s.repo);
  if (s.view !== DEFAULTS.view) q.set('view', s.view);
  if (s.viz !== DEFAULTS.viz) q.set('viz', s.viz);
  if (s.src !== DEFAULTS.src) q.set('src', s.src);
  if (s.domain) q.set('domain', s.domain);
  if (s.feat) q.set('feat', s.feat);
  if (Math.abs(s.zoom - DEFAULTS.zoom) > 0.001) q.set('zoom', String(s.zoom));
  const str = q.toString();
  return str ? '?' + str : '';
}

/** Applique un changement partiel, en purgeant la sélection devenue invalide. */
export function reduceState(
  prev: AtlasState,
  patch: Partial<AtlasState>,
  domainsOf: DomainsOf = staticDomains,
): AtlasState {
  const next = { ...prev, ...patch };

  if (
    (patch.repo !== undefined && patch.repo !== prev.repo) ||
    (patch.src !== undefined && patch.src !== prev.src)
  ) {
    next.domain = patch.domain ?? null;
    next.feat = patch.feat ?? null;
  }

  // Un autre domaine sans fonctionnalité désignée : l'ancienne n'y est pas.
  if (patch.domain !== undefined && patch.domain !== prev.domain && patch.feat === undefined) {
    next.feat = null;
  }

  // Sans domaines connus, la sélection est gardée telle quelle : la vue qui
  // l'affiche ignore une clé qu'elle ne trouve pas.
  const known = domainsOf(next.repo, next.src);
  if (!known) return next;

  const domain = known.find((d) => d.key === next.domain) ?? null;
  if (!domain) {
    next.domain = null;
    next.feat = null;
  } else if (next.feat && !domain.features.some((f) => f.name === next.feat)) {
    next.feat = null;
  }

  return next;
}
