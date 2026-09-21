import { LABELS, ORDER, STATE_LABEL } from '../data/labels';
import type { Domain, Status, Theme } from '../data/types';

/* Carte à branches : tout est dessiné, on navigue au zoom et au scroll. */
const LEAF_H = 44;
const LEAF_PITCH = 54;
const BLOCK_GAP = 46;
const X_ROOT = 30;
const W_ROOT = 260;
const X_DOM = 400;
const W_DOM = 300;
const X_LEAF = 800;
const W_LEAF = 360;
const CANVAS_W = 1200;

export interface MapLeaf {
  key: string;
  domainKey: string;
  name: string;
  status: string;
  statusFg: string;
  left: string;
  top: string;
  w: string;
  h: string;
  dot: string;
  bg: string;
  ink: string;
  border: string;
}

export interface MapDomain {
  key: string;
  num: string;
  name: string;
  role: string;
  count: string;
  left: string;
  top: string;
  w: string;
  bg: string;
  ink: string;
  inkSoft: string;
  border: string;
  ring: string;
}

export interface MapEdge {
  key: string;
  d: string;
  stroke: string;
  w: number;
}

export interface GraphMapModel {
  mapDomains: MapDomain[];
  mapLeaves: MapLeaf[];
  mapEdges: MapEdge[];
  canvasW: string;
  canvasH: string;
  viewBox: string;
  rootTop: string;
  rootLeft: string;
  rootW: string;
}

export function buildMap(
  domains: Domain[],
  t: Theme,
  selectedDomain: string | null,
  selectedFeat: string | null,
): GraphMapModel {
  const mapDomains: MapDomain[] = [];
  const mapLeaves: MapLeaf[] = [];
  const rawEdges: (MapEdge & { root?: boolean })[] = [];
  let y = 40;

  domains.forEach((d) => {
    const tn = t.tones[d.tone];
    const k = d.features.length;
    const blockH = k * LEAF_PITCH;
    const domCy = y + blockH / 2;

    d.features.forEach((f, i) => {
      const cy = y + i * LEAF_PITCH + LEAF_PITCH / 2;
      const on = selectedFeat === f.name;
      const sfg = t.statusFg[f.status] || t.inkSoft;
      mapLeaves.push({
        key: d.key + '/' + f.name,
        domainKey: d.key,
        name: f.name,
        status: LABELS[f.status],
        statusFg: on ? tn.ink : sfg,
        left: X_LEAF + 'px',
        top: cy - LEAF_H / 2 + 'px',
        w: W_LEAF + 'px',
        h: LEAF_H + 'px',
        dot: sfg,
        bg: on ? tn.bg : t.surfaceAlt,
        ink: on ? tn.ink : t.ink,
        border: on ? tn.border : t.line,
      });
      const x1 = X_DOM + W_DOM;
      const x2 = X_LEAF;
      const mx = (x1 + x2) / 2;
      rawEdges.push({
        key: 'leaf:' + d.key + '/' + f.name,
        d: `M${x1} ${domCy} C${mx} ${domCy} ${mx} ${cy} ${x2} ${cy}`,
        stroke: on ? tn.dot : t.line,
        w: on ? 2.6 : 1.4,
      });
    });

    const onD = selectedDomain === d.key;
    mapDomains.push({
      key: d.key,
      num: d.num,
      name: d.name,
      role: d.role,
      count: k + ' fonctionnalités',
      left: X_DOM + 'px',
      top: domCy - 47 + 'px',
      w: W_DOM + 'px',
      bg: tn.bg,
      ink: tn.ink,
      inkSoft: tn.inkSoft,
      border: tn.border,
      ring: onD ? '0 0 0 3px ' + tn.dot : 'none',
    });

    const rx1 = X_ROOT + W_ROOT;
    const rmx = (rx1 + X_DOM) / 2;
    rawEdges.push({
      key: 'root:' + d.key,
      d: `M${rx1} 0 C${rmx} 0 ${rmx} ${domCy} ${X_DOM} ${domCy}`,
      stroke: tn.dot,
      w: 2.2,
      root: true,
    });

    y += blockH + BLOCK_GAP;
  });

  const canvasH = y;
  const rootCy = canvasH / 2;
  const mapEdges: MapEdge[] = rawEdges.map((e) =>
    e.root
      ? { ...e, d: e.d.replace(/^M(\S+) 0 C(\S+) 0/, `M$1 ${rootCy} C$2 ${rootCy}`) }
      : e,
  );

  return {
    mapDomains,
    mapLeaves,
    mapEdges,
    canvasW: CANVAS_W + 'px',
    canvasH: canvasH + 'px',
    viewBox: `0 0 ${CANVAS_W} ${canvasH}`,
    rootTop: rootCy - 54 + 'px',
    rootLeft: X_ROOT + 'px',
    rootW: W_ROOT + 'px',
  };
}

export const CANVAS_WIDTH = CANVAS_W;

/* État par branche, lisible d'un coup d'œil. */
type Counts = Record<Status, number>;

function stateOf(c: Counts, total: number): string {
  if (c.wip > 0) return 'wip';
  if (c.live === total) return 'live';
  if (c.frozen + c.idea === total) return 'frozen';
  return c.frozen + c.idea > c.live ? 'frozen' : 'partial';
}

export interface Segment {
  key: string;
  w: string;
  bg: string;
  label: string;
}

export interface OverviewRow {
  key: string;
  num: string;
  name: string;
  total: string;
  dot: string;
  state: string;
  stateFg: string;
  rowBg: string;
  segs: Segment[];
}

export interface OverviewModel {
  overview: OverviewRow[];
  projectSegs: Segment[];
  projectCounts: string;
}

export function buildOverview(
  domains: Domain[],
  t: Theme,
  selectedDomain: string | null,
): OverviewModel {
  const tally: Counts = { live: 0, wip: 0, frozen: 0, idea: 0 };

  const overview = domains.map((d) => {
    const c: Counts = { live: 0, wip: 0, frozen: 0, idea: 0 };
    d.features.forEach((f) => {
      c[f.status]++;
      tally[f.status]++;
    });
    const total = d.features.length;
    const st = stateOf(c, total);
    return {
      key: d.key,
      num: d.num,
      name: d.name,
      total: total + '',
      dot: t.tones[d.tone].dot,
      state: STATE_LABEL[st],
      stateFg: t.statusFg[st] || t.inkSoft,
      rowBg: selectedDomain === d.key ? t.surfaceAlt : 'transparent',
      segs: ORDER.filter((s) => c[s] > 0).map((s) => ({
        key: s,
        w: (c[s] / total) * 100 + '%',
        bg: t.statusFg[s],
        label: c[s] + ' ' + LABELS[s],
      })),
    };
  });

  const grandTotal = ORDER.reduce((a, s) => a + tally[s], 0);
  const projectSegs = ORDER.filter((s) => tally[s] > 0).map((s) => ({
    key: s,
    w: (tally[s] / grandTotal) * 100 + '%',
    bg: t.statusFg[s],
    label: tally[s] + ' ' + LABELS[s],
  }));
  const projectCounts = ORDER.filter((s) => tally[s] > 0)
    .map((s) => tally[s] + ' ' + LABELS[s])
    .join(' · ');

  return { overview, projectSegs, projectCounts };
}
