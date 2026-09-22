import { REPOS } from '../data/repos';
import { VIEWS } from '../data/labels';
import type { TreeSource, ViewId, VizMode } from '../data/types';

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
 * Lit un état complet depuis une query string, en retombant sur les valeurs par
 * défaut dès qu'un paramètre ne correspond à rien de connu — une URL trafiquée
 * ouvre l'application, elle ne la casse pas.
 */
export function parseState(search: string): AtlasState {
  const q = new URLSearchParams(search);

  const repo = q.get('repo');
  const safeRepo = repo && REPOS[repo] ? repo : DEFAULTS.repo;

  const view = q.get('view');
  const safeView = VIEWS.some((v) => v.id === view) ? (view as ViewId) : DEFAULTS.view;

  const viz = q.get('viz');
  const safeViz: VizMode = viz === 'graph' || viz === 'list' ? viz : DEFAULTS.viz;

  const src = q.get('src');
  const safeSrc: TreeSource = src === 'repo' ? 'repo' : DEFAULTS.src;

  const domains = REPOS[safeRepo].domains;
  const domainKey = q.get('domain');
  const domain = domains.find((d) => d.key === domainKey) ?? null;

  const featName = q.get('feat');
  const feat = domain?.features.find((f) => f.name === featName) ?? null;

  const rawZoom = Number(q.get('zoom'));
  const zoom = ZOOM_STEPS.find((z) => Math.abs(z - rawZoom) < 0.001) ?? DEFAULTS.zoom;

  return {
    repo: safeRepo,
    view: safeView,
    viz: safeViz,
    src: safeSrc,
    domain: domain ? domain.key : null,
    feat: feat ? feat.name : null,
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
export function reduceState(prev: AtlasState, patch: Partial<AtlasState>): AtlasState {
  const next = { ...prev, ...patch };

  if (
    (patch.repo !== undefined && patch.repo !== prev.repo) ||
    (patch.src !== undefined && patch.src !== prev.src)
  ) {
    next.domain = patch.domain ?? null;
    next.feat = patch.feat ?? null;
  }

  // L'arbre du dépôt a ses propres clés, qu'on ne peut pas valider ici : seule
  // la description écrite est vérifiable contre les données.
  if (next.src === 'repo') return next;

  const domain = REPOS[next.repo].domains.find((d) => d.key === next.domain) ?? null;
  if (!domain) {
    next.domain = null;
    next.feat = null;
  } else if (next.feat && !domain.features.some((f) => f.name === next.feat)) {
    next.feat = null;
  }

  return next;
}
