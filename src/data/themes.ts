import type { PaletteSpec } from '../lib/palette';
import { buildTheme } from '../lib/palette';
import type { Theme } from './types';

/* Palettes lues dans le code de chaque dépôt :
   Sole-Citron   → src/styles/tokens.css
   Eleven-Fields → assets/style.css
   Futuremoi     → src/freelance_radar/web/templates/base.html.j2
   bottrading    → app/web/static/index.html, elon-brand-identity-v2.html
   Clip-Core     → frontend/tailwind.config.ts, frontend/app/globals.css
   Happicture    → CLAUDE.md › Design system › Palette */

/**
 * La barre d'application — le bandeau « Atlas » et les onglets de dépôt — ne
 * change pas d'un dépôt à l'autre : c'est le cadre, pas le contenu. Ses couleurs
 * viennent de la maquette et vivent ici plutôt que dans un composant.
 */
export const CHROME = {
  bar: '#101014',
  ink: '#FAFAF8',
  inkSoft: 'rgba(250,250,248,0.6)',
  swatchTray: '#7A7A82',
};

/**
 * Les dépôts suivants partent de la palette que chacun déclare ; le reste du
 * thème — encres sur fond, pastilles, tons de domaine — se déduit par contraste.
 * Quand une palette n'a pas de variante utilisable, c'est dit en commentaire.
 */
export const PALETTES: Record<string, PaletteSpec> = {
  atlas: {
    mode: 'light',
    // Trois couleurs de marque : Black Forest, Maroon, Vanilla Custard. La page
    // et les cartes en sont des teintes plus claires ; l'encre est le maroon.
    page: '#FBF5E1', surface: '#FFFDF6', surfaceAlt: '#F7E7AF',
    ink: '#800000', inkSoft: 'rgba(128,0,0,0.78)', inkFaint: 'rgba(128,0,0,0.6)',
    line: 'rgba(128,0,0,0.16)',
    primary: '#F7E7AF', accent: '#004800',
    tones: ['#004800', '#800000', '#F7E7AF'],
    live: '#004800', wip: '#800000', warn: '#800000',
    display: "Marion, Georgia, 'Times New Roman', serif", displayWeight: '700', emStyle: 'normal',
    swatches: [
      { hex: '#004800', title: 'Black Forest #004800' },
      { hex: '#800000', title: 'Maroon #800000' },
      { hex: '#F7E7AF', title: 'Vanilla Custard #F7E7AF' },
    ],
    source: 'palette Black Forest · Maroon · Vanilla Custard',
  },
  futuremoi: {
    mode: 'light',
    page: '#FBFBFA', surface: '#FFFFFF', surfaceAlt: '#F3F4F6',
    ink: '#1F2328', inkSoft: '#6B7280', inkFaint: 'rgba(31,35,40,0.5)', line: '#E5E7EB',
    // L'en-tête prend l'encre ; l'accent vert foncé s'y perdrait, on y pose
    // donc celui que le projet déclare pour son mode sombre.
    primary: '#1F2328', accent: '#6BBF8F',
    tones: ['#2F6F4F', '#B45309', '#1F2328'],
    live: '#2F6F4F', wip: '#B45309', warn: '#B91C1C',
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    displayWeight: '700', emStyle: 'normal',
    swatches: [
      { hex: '#2F6F4F', title: '--accent #2f6f4f' },
      { hex: '#6BBF8F', title: '--accent sombre #6bbf8f' },
      { hex: '#B45309', title: '--warn #b45309' },
      { hex: '#1F2328', title: '--ink #1f2328' },
      { hex: '#FBFBFA', title: '--bg #fbfbfa' },
    ],
    source: 'palette lue dans src/freelance_radar/web/templates/base.html.j2',
  },
  bottrading: {
    mode: 'dark',
    page: '#0A0B0F', surface: '#131620', surfaceAlt: '#1A1E2B',
    ink: '#F0F1F5', inkSoft: '#9497A8', inkFaint: '#5C5F70', line: 'rgba(255,255,255,0.09)',
    primary: '#131620', accent: '#8B5CF6',
    tones: ['#8B5CF6', '#06B6D4', '#EC4899'],
    live: '#10B981', wip: '#F59E0B', warn: '#FB7185',
    display: "'Space Grotesk', Manrope, sans-serif", displayWeight: '700', emStyle: 'normal',
    swatches: [
      { hex: '#0A0B0F', title: '--bg #0a0b0f' },
      { hex: '#131620', title: '--surface #131620' },
      { hex: '#8B5CF6', title: '--violet #8b5cf6' },
      { hex: '#06B6D4', title: '--cyan #06b6d4' },
      { hex: '#EC4899', title: '--magenta #ec4899' },
      { hex: '#10B981', title: '--success #10b981' },
    ],
    source: 'palette lue dans app/web/static/index.html',
  },
  clipcore: {
    mode: 'dark',
    // Tailwind neutral 950 / 900 / 800, texte 100 / 400 / 500.
    page: '#0A0A0A', surface: '#171717', surfaceAlt: '#262626',
    ink: '#F5F5F5', inkSoft: '#A3A3A3', inkFaint: '#737373', line: '#262626',
    primary: '#171717', accent: '#9146FF',
    // twitch, emerald-400, amber-400 : les trois couleurs que l'interface emploie.
    tones: ['#9146FF', '#34D399', '#FBBF24'],
    live: '#34D399', wip: '#FBBF24', warn: '#F87171',
    display: 'Manrope, Helvetica, sans-serif', displayWeight: '800', emStyle: 'normal',
    swatches: [
      { hex: '#9146FF', title: 'twitch #9146FF' },
      { hex: '#772CE8', title: 'twitch.dark #772CE8' },
      { hex: '#0A0A0A', title: 'neutral-950 #0a0a0a' },
      { hex: '#171717', title: 'neutral-900 #171717' },
      { hex: '#34D399', title: 'emerald-400 #34d399' },
    ],
    source: 'palette lue dans frontend/tailwind.config.ts',
  },
  happicture: {
    mode: 'light',
    page: '#E7E2D6', surface: '#FFFFFF', surfaceAlt: '#FBF8F1',
    // « faint » (#9a9085) ne se lit pas sur le canevas : muted en tient lieu.
    ink: '#1C1814', inkSoft: '#4A4239', inkFaint: '#6B6258', line: '#D8CDB4',
    primary: '#1C1814', accent: '#C2542A',
    tones: ['#C2542A', '#6B7A5A', '#4A5C8B'],
    live: '#6B7A5A', wip: '#B8862A', warn: '#C2542A',
    display: "Sora, Manrope, sans-serif", displayWeight: '600', emStyle: 'normal',
    swatches: [
      { hex: '#C2542A', title: 'accent #c2542a' },
      { hex: '#1C1814', title: 'ink #1c1814' },
      { hex: '#6B7A5A', title: 'green #6b7a5a' },
      { hex: '#4A5C8B', title: 'en diffusion #4a5c8b' },
      { hex: '#FBF8F1', title: 'paper #fbf8f1' },
      { hex: '#E7E2D6', title: 'canvas #e7e2d6' },
    ],
    source: 'palette lue dans CLAUDE.md › Design system',
  },
};

export const THEMES: Record<string, Theme> = {
  sole: {
    page: '#F5F5F2', surface: '#FFFFFF', surfaceAlt: '#EFEDE5',
    ink: '#0A1A3F', inkSoft: 'rgba(10,26,63,0.7)', inkFaint: 'rgba(10,26,63,0.45)',
    line: 'rgba(10,26,63,0.13)',
    primary: '#0E3FB5', onPrimary: '#F5F5F2', onPrimarySoft: 'rgba(245,245,242,0.84)',
    hairline: 'rgba(245,245,242,0.24)',
    accent: '#F2D205', onAccent: '#0A1A3F',
    display: "'DM Serif Display', Georgia, serif", displayWeight: '400', emStyle: 'italic',
    warnBg: '#EFEDE5', warnBorder: '#0A1A3F', warnFg: '#0A1A3F',
    statusFg: { live: '#0E3FB5', wip: '#7A6800', frozen: 'rgba(10,26,63,0.78)', idea: 'rgba(10,26,63,0.62)' },
    pills: {
      live:   { bg: '#0E3FB5', fg: '#F5F5F2', border: '#0E3FB5' },
      wip:    { bg: '#F2D205', fg: '#0A1A3F', border: '#F2D205' },
      frozen: { bg: 'transparent', fg: 'rgba(10,26,63,0.6)', border: 'rgba(10,26,63,0.3)' },
      idea:   { bg: 'transparent', fg: 'rgba(10,26,63,0.5)', border: 'rgba(10,26,63,0.2)' }
    },
    tones: {
      a: { bg: '#0E3FB5', ink: '#F5F5F2', inkSoft: 'rgba(245,245,242,0.8)', border: '#0E3FB5', dot: '#0E3FB5', chipBg: 'rgba(245,245,242,0.18)' },
      b: { bg: '#F2D205', ink: '#0A1A3F', inkSoft: 'rgba(10,26,63,0.74)', border: '#F2D205', dot: '#F2D205', chipBg: 'rgba(10,26,63,0.12)' },
      c: { bg: '#0A1A3F', ink: '#F5F5F2', inkSoft: 'rgba(245,245,242,0.78)', border: '#0A1A3F', dot: '#0A1A3F', chipBg: 'rgba(245,245,242,0.18)' },
      d: { bg: '#EFEDE5', ink: '#0A1A3F', inkSoft: 'rgba(10,26,63,0.66)', border: 'rgba(10,26,63,0.18)', dot: 'rgba(10,26,63,0.45)', chipBg: 'rgba(10,26,63,0.08)' }
    },
    swatches: [
      { hex: '#0E3FB5', title: '--cobalt #0E3FB5' },
      { hex: '#F2D205', title: '--citron #F2D205' },
      { hex: '#0A1A3F', title: '--navy #0A1A3F' },
      { hex: '#EFEDE5', title: '--offwhite-warm #EFEDE5' },
      { hex: '#F5F5F2', title: '--offwhite #F5F5F2' }
    ],
    source: 'palette + typo lues dans src/styles/tokens.css'
  },
  eleven: {
    page: '#0E1117', surface: '#16213E', surfaceAlt: '#1A1A2E',
    ink: '#FFFFFF', inkSoft: '#8899AA', inkFaint: 'rgba(136,153,170,0.72)',
    line: '#2D2D4E',
    primary: '#16213E', onPrimary: '#FFFFFF', onPrimarySoft: '#8899AA',
    hairline: '#2D2D4E',
    accent: '#00FF99', onAccent: '#0E1117',
    display: "Manrope, Helvetica, sans-serif", displayWeight: '800', emStyle: 'normal',
    warnBg: 'rgba(255,70,85,0.12)', warnBorder: '#FF4655', warnFg: '#FF4655',
    statusFg: { live: '#00FF99', wip: '#FFD700', frozen: '#8899AA', idea: '#8899AA' },
    pills: {
      live:   { bg: '#00FF99', fg: '#0E1117', border: '#00FF99' },
      wip:    { bg: '#FFD700', fg: '#0E1117', border: '#FFD700' },
      frozen: { bg: 'transparent', fg: '#8899AA', border: '#2D2D4E' },
      idea:   { bg: 'transparent', fg: '#8899AA', border: '#2D2D4E' }
    },
    tones: {
      a: { bg: '#16213E', ink: '#FFFFFF', inkSoft: '#8899AA', border: '#00FF99', dot: '#00FF99', chipBg: '#2D2D4E' },
      b: { bg: '#16213E', ink: '#FFFFFF', inkSoft: '#8899AA', border: '#00B4D8', dot: '#00B4D8', chipBg: '#2D2D4E' },
      c: { bg: '#16213E', ink: '#FFFFFF', inkSoft: '#8899AA', border: '#FFD700', dot: '#FFD700', chipBg: '#2D2D4E' },
      d: { bg: '#1A1A2E', ink: '#FFFFFF', inkSoft: '#8899AA', border: '#2D2D4E', dot: '#8899AA', chipBg: '#2D2D4E' }
    },
    swatches: [
      { hex: '#0E1117', title: '--bg #0e1117' },
      { hex: '#16213E', title: '--card #16213e' },
      { hex: '#00FF99', title: '--green #00ff99' },
      { hex: '#00B4D8', title: '--blue #00b4d8' },
      { hex: '#FFD700', title: '--gold #ffd700' },
      { hex: '#FF4655', title: '--red #ff4655' }
    ],
    source: 'palette lue dans assets/style.css'
  },
  atlas: buildTheme(PALETTES.atlas),
  futuremoi: buildTheme(PALETTES.futuremoi),
  bottrading: buildTheme(PALETTES.bottrading),
  clipcore: buildTheme(PALETTES.clipcore),
  happicture: buildTheme(PALETTES.happicture),
};
