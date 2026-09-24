import type { Swatch, Theme, Tone, ToneKey } from '../data/types';
import { contrast, readableOn, withAlpha } from './color';

/**
 * Un thème complet à partir de la palette d'un projet.
 *
 * Les trois premiers dépôts ont chacun un thème écrit à la main, champ par
 * champ. Pour les suivants, on part de ce que le projet déclare vraiment — ses
 * variables CSS, sa config Tailwind, la palette de son CLAUDE.md — et on en
 * déduit le reste : chaque encre posée sur un fond est choisie par le contraste,
 * jamais à l'œil.
 */
export interface PaletteSpec {
  /** Clair ou sombre : en sombre, les cartes restent sombres et la couleur passe au liseré. */
  mode: 'light' | 'dark';
  page: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  line: string;
  /** Le fond de l'en-tête. */
  primary: string;
  accent: string;
  /** Trois couleurs de marque, pour distinguer les domaines. */
  tones: [string, string, string];
  /** Ce qui est fait, et ce qui est en cours. */
  live: string;
  wip: string;
  warn: string;
  display: string;
  displayWeight: string;
  emStyle: string;
  swatches: Swatch[];
  source: string;
}

/** Le seuil WCAG AA pour un texte courant. */
const AA = 4.5;
/** Le seuil pour un texte gras ou un repère graphique. */
const AA_LARGE = 3;

/**
 * L'encre à poser sur un fond : la plus lisible de la palette, et le blanc ou le
 * noir purs seulement quand aucune couleur du projet n'atteint le seuil.
 */
function inkOn(bg: string, spec: PaletteSpec): string {
  const best = readableOn(bg, [spec.page, spec.ink, spec.surface]);
  return contrast(best, bg) >= AA ? best : readableOn(bg, [best, '#FFFFFF', '#000000']);
}

/** Une couleur écrite sur la page, tant qu'elle s'y lit ; sinon, l'encre. */
function legible(color: string, spec: PaletteSpec, min: number): string {
  return contrast(color, spec.page) >= min ? color : spec.ink;
}

/** Une couleur de marque en ton de domaine, lisible dans les deux modes. */
function toneOf(color: string, spec: PaletteSpec): Tone {
  if (spec.mode === 'dark') {
    // En sombre, une carte vivement colorée crie : elle reste sombre, la couleur
    // passe au liseré et à la pastille — comme chez Eleven-Fields.
    return {
      bg: spec.surface,
      ink: spec.ink,
      inkSoft: spec.inkSoft,
      border: color,
      dot: color,
      chipBg: spec.line,
    };
  }
  const ink = inkOn(color, spec);
  return {
    bg: color,
    ink,
    inkSoft: withAlpha(ink, 0.8),
    border: color,
    dot: color,
    chipBg: withAlpha(ink, 0.16),
  };
}

export function buildTheme(spec: PaletteSpec): Theme {
  const onPrimary = inkOn(spec.primary, spec);
  const onAccent = inkOn(spec.accent, spec);
  const onLive = inkOn(spec.live, spec);
  const onWip = inkOn(spec.wip, spec);

  const tones: Record<ToneKey, Tone> = {
    a: toneOf(spec.tones[0], spec),
    b: toneOf(spec.tones[1], spec),
    c: toneOf(spec.tones[2], spec),
    d: {
      bg: spec.surfaceAlt,
      ink: spec.ink,
      inkSoft: spec.inkSoft,
      border: spec.line,
      dot: spec.inkFaint,
      chipBg: withAlpha(spec.ink, 0.08),
    },
  };

  return {
    page: spec.page,
    surface: spec.surface,
    surfaceAlt: spec.surfaceAlt,
    ink: spec.ink,
    inkSoft: spec.inkSoft,
    inkFaint: spec.inkFaint,
    line: spec.line,
    primary: spec.primary,
    onPrimary,
    onPrimarySoft: withAlpha(onPrimary, 0.8),
    hairline: withAlpha(onPrimary, 0.2),
    accent: spec.accent,
    onAccent,
    display: spec.display,
    displayWeight: spec.displayWeight,
    emStyle: spec.emStyle,
    warnBg: withAlpha(spec.warn, 0.12),
    warnBorder: spec.warn,
    // L'avertissement s'écrit dans sa couleur tant qu'elle se lit ; sinon, à l'encre.
    warnFg: legible(spec.warn, spec, AA),
    // Un statut s'écrit en gras dans sa couleur, tant qu'elle se lit sur la page.
    statusFg: {
      live: legible(spec.live, spec, AA_LARGE),
      wip: legible(spec.wip, spec, AA_LARGE),
      frozen: spec.inkSoft,
      idea: spec.inkFaint,
    },
    pills: {
      live: { bg: spec.live, fg: onLive, border: spec.live },
      wip: { bg: spec.wip, fg: onWip, border: spec.wip },
      frozen: { bg: 'transparent', fg: spec.inkSoft, border: withAlpha(spec.ink, 0.3) },
      idea: { bg: 'transparent', fg: spec.inkFaint, border: withAlpha(spec.ink, 0.2) },
    },
    tones,
    swatches: spec.swatches,
    source: spec.source,
  };
}
