import { cleanInline, splitSections } from './context';
import { contrast, withAlpha } from './color';
import type { PaletteSpec } from './palette';

/**
 * La direction artistique qu'un projet déclare dans son atlas.md.
 *
 * Une palette recopiée dans Atlas vieillit dès que le projet change de charte ;
 * lue dans son atlas.md, elle suit. Le format est souple — tableau ou liste,
 * un rôle et une couleur par ligne — et ce qui ne s'y lit pas est ignoré.
 *
 *     ## Direction artistique
 *     | Rôle | Couleur |
 *     | --- | --- |
 *     | Fond | `#FFF4E5` |
 *     | Encre | `#2F1C11` |
 *     | Accent | `#F3BBC8` |
 *     | Marque | `#1746D1` |
 *     Police des titres : DynaPuff
 */

export type PaletteRole =
  | 'page'
  | 'surface'
  | 'surfaceAlt'
  | 'ink'
  | 'inkSoft'
  | 'inkFaint'
  | 'line'
  | 'primary'
  | 'accent'
  | 'live'
  | 'wip'
  | 'warn'
  | 'brand';

export interface PaletteEntry {
  role: PaletteRole;
  hex: string;
  /** Le nom que le projet donne à cette couleur. */
  label: string;
}

export interface AtlasPalette {
  entries: PaletteEntry[];
  /** La police des titres, telle que nommée. */
  display: string | null;
  mode: 'light' | 'dark' | null;
}

const HEADING = /^(direction artistique|charte( graphique)?|palette|identit[ée] visuelle)\b/i;
const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b/i;

/** Du plus précis au plus général : « encre douce » avant « encre ». */
const ROLES: [PaletteRole, RegExp][] = [
  ['inkSoft', /(encre|texte) (douce?|secondaire)/i],
  ['inkFaint', /(encre|texte) (p[âa]le|discr[eè]te?|tertiaire)/i],
  ['surfaceAlt', /(surface|fond) (secondaire|alternative?|chaude?)|papier/i],
  ['primary', /en-?t[êe]te|bandeau|header/i],
  ['line', /bordure|filet|ligne de s[ée]paration/i],
  ['live', /succ[eè]s|en ligne|valid/i],
  ['wip', /en cours/i],
  ['warn', /alerte|erreur|danger|avertissement/i],
  ['accent', /accent|action/i],
  ['page', /fond|page|arri[eè]re-plan|canevas/i],
  ['surface', /surface|carte|panneau/i],
  ['ink', /encre|texte/i],
];

function roleOf(label: string): PaletteRole {
  return ROLES.find(([, test]) => test.test(label))?.[0] ?? 'brand';
}

/** Une ligne de tableau ou de liste réduite à son libellé et à sa valeur. */
function cellsOf(line: string): { label: string; value: string } | null {
  const trimmed = line.trim();
  if (trimmed.startsWith('|')) {
    if (/^\|[\s|:-]+\|?$/.test(trimmed)) return null;
    const cells = trimmed
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => cleanInline(c.replace(/`/g, '')));
    const valueCell = cells.find((c) => HEX.test(c)) ?? cells[1] ?? '';
    const label = cells.find((c) => c && c !== valueCell) ?? '';
    return { label, value: valueCell };
  }
  const m = /^(?:[-*+]\s+)?([^:]+?)\s*:\s*(.+)$/.exec(trimmed);
  if (!m) return null;
  return { label: cleanInline(m[1].replace(/`/g, '')), value: cleanInline(m[2].replace(/`/g, '')) };
}

/** Lit la section « Direction artistique » d'un atlas.md, s'il y en a une. */
export function parsePalette(md: string): AtlasPalette | null {
  const section = splitSections(md).find(
    (s) => s.level === 2 && HEADING.test(cleanInline(s.heading)),
  );
  if (!section) return null;

  const entries: PaletteEntry[] = [];
  let display: string | null = null;
  let mode: AtlasPalette['mode'] = null;

  section.lines.forEach((line) => {
    const cells = cellsOf(line);
    if (!cells) return;
    const { label, value } = cells;

    if (/police|typo/i.test(label) && /titre|display/i.test(label)) {
      display = value.split(/[,(—–]/)[0].trim() || null;
      return;
    }
    if (/^(mode|th[èe]me)\b/i.test(label)) {
      if (/sombre|dark|nuit/i.test(value)) mode = 'dark';
      else if (/clair|light|jour/i.test(value)) mode = 'light';
      return;
    }
    const hex = HEX.exec(value)?.[0];
    if (!hex || !label) return;
    entries.push({ role: roleOf(label), hex: hex.toUpperCase(), label });
  });

  return entries.length ? { entries, display, mode } : null;
}

/**
 * Complète la palette déclarée en une spécification de thème. Fond, encre et
 * accent sont exigés : sans eux, le thème serait deviné, et on préfère garder
 * celui qu'on connaît.
 */
export function paletteSpecFrom(p: AtlasPalette): PaletteSpec | null {
  const first = (role: PaletteRole) => p.entries.find((e) => e.role === role)?.hex ?? null;
  const page = first('page');
  const ink = first('ink');
  const accent = first('accent');
  if (!page || !ink || !accent) return null;

  const mode = p.mode ?? (contrast(page, '#000000') >= contrast(page, '#FFFFFF') ? 'light' : 'dark');
  const surface = first('surface') ?? page;
  const brands = p.entries.filter((e) => e.role === 'brand').map((e) => e.hex);
  const primary = first('primary') ?? (mode === 'dark' ? surface : ink);
  const pool = [...brands, accent, primary].filter((c, i, all) => all.indexOf(c) === i);
  while (pool.length < 3) pool.push(ink);

  return {
    mode,
    page,
    surface,
    surfaceAlt: first('surfaceAlt') ?? surface,
    ink,
    inkSoft: first('inkSoft') ?? withAlpha(ink, 0.78),
    inkFaint: first('inkFaint') ?? withAlpha(ink, 0.6),
    line: first('line') ?? withAlpha(ink, 0.16),
    primary,
    accent,
    tones: [pool[0], pool[1], pool[2]],
    live: first('live') ?? brands[0] ?? accent,
    wip: first('wip') ?? brands[1] ?? accent,
    warn: first('warn') ?? first('wip') ?? accent,
    display: p.display ? `'${p.display}', Manrope, Helvetica, sans-serif` : 'Manrope, Helvetica, sans-serif',
    displayWeight: '700',
    emStyle: 'normal',
    swatches: p.entries.map((e) => ({ hex: e.hex, title: `${e.label} ${e.hex}` })),
    source: 'palette lue dans atlas.md',
  };
}

/**
 * La feuille Google Fonts d'une police de titres nommée dans atlas.md, ou null
 * pour une police système. Seul le nom de la famille part vers Google.
 */
export function googleFontHref(family: string | null): string | null {
  if (!family) return null;
  const name = family.trim();
  if (!/^[\p{L}\p{N} ]{2,40}$/u.test(name)) return null;
  if (/^(system-ui|serif|sans-serif|monospace|georgia|arial|helvetica)$/i.test(name)) return null;
  return `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
}
