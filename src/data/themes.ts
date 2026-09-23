import type { Theme } from './types';

/* Palettes lues dans le code de chaque dépôt :
   Sole-Citron   → src/styles/tokens.css
   Eleven-Fields → assets/style.css */

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
  atlas: {
    page: '#FAFAF8', surface: '#FFFFFF', surfaceAlt: '#F1EFEA',
    ink: '#101014', inkSoft: 'rgba(16,16,20,0.68)', inkFaint: 'rgba(16,16,20,0.45)',
    line: 'rgba(16,16,20,0.14)',
    primary: '#101014', onPrimary: '#FAFAF8', onPrimarySoft: 'rgba(250,250,248,0.8)',
    hairline: 'rgba(250,250,248,0.2)',
    accent: '#D97757', onAccent: '#101014',
    display: 'Manrope, Helvetica, sans-serif', displayWeight: '800', emStyle: 'normal',
    warnBg: '#F1EFEA', warnBorder: '#101014', warnFg: '#101014',
    statusFg: { live: '#2F7D5B', wip: '#B4762B', frozen: 'rgba(16,16,20,0.7)', idea: 'rgba(16,16,20,0.5)' },
    pills: {
      live:   { bg: '#2F7D5B', fg: '#FAFAF8', border: '#2F7D5B' },
      wip:    { bg: '#D97757', fg: '#101014', border: '#D97757' },
      frozen: { bg: 'transparent', fg: 'rgba(16,16,20,0.6)', border: 'rgba(16,16,20,0.28)' },
      idea:   { bg: 'transparent', fg: 'rgba(16,16,20,0.5)', border: 'rgba(16,16,20,0.2)' }
    },
    tones: {
      a: { bg: '#101014', ink: '#FAFAF8', inkSoft: 'rgba(250,250,248,0.76)', border: '#101014', dot: '#101014', chipBg: 'rgba(250,250,248,0.16)' },
      b: { bg: '#D97757', ink: '#101014', inkSoft: 'rgba(16,16,20,0.72)', border: '#D97757', dot: '#D97757', chipBg: 'rgba(16,16,20,0.12)' },
      c: { bg: '#2F7D5B', ink: '#FAFAF8', inkSoft: 'rgba(250,250,248,0.78)', border: '#2F7D5B', dot: '#2F7D5B', chipBg: 'rgba(250,250,248,0.16)' },
      d: { bg: '#F1EFEA', ink: '#101014', inkSoft: 'rgba(16,16,20,0.64)', border: 'rgba(16,16,20,0.18)', dot: 'rgba(16,16,20,0.45)', chipBg: 'rgba(16,16,20,0.08)' }
    },
    swatches: [
      { hex: '#101014', title: '--encre #101014' },
      { hex: '#D97757', title: '--accent #D97757' },
      { hex: '#2F7D5B', title: '--vert #2F7D5B' },
      { hex: '#F1EFEA', title: '--papier-chaud #F1EFEA' },
      { hex: '#FAFAF8', title: '--papier #FAFAF8' }
    ],
    source: 'palette lue dans src/index.css et src/data/themes.ts'
  }
};
