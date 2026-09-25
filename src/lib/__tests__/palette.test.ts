import { describe, expect, it } from 'vitest';
import { PALETTES, THEMES } from '../../data/themes';
import { contrast } from '../color';
import type { PaletteSpec } from '../palette';
import { buildTheme } from '../palette';

const base: PaletteSpec = {
  mode: 'light',
  page: '#FAFAFA', surface: '#FFFFFF', surfaceAlt: '#F0F0F0',
  ink: '#111111', inkSoft: '#555555', inkFaint: '#777777', line: '#DDDDDD',
  primary: '#111111', accent: '#FFCC00',
  tones: ['#0044CC', '#FFCC00', '#111111'],
  live: '#117733', wip: '#AA5500', warn: '#CC0000',
  display: 'serif', displayWeight: '400', emStyle: 'italic',
  swatches: [], source: 'essai',
};

describe('buildTheme', () => {
  it('choisit l’encre de chaque fond par le contraste', () => {
    const t = buildTheme(base);
    expect(t.onPrimary).toBe('#FFFFFF');
    expect(t.onAccent).toBe('#111111');
    expect(t.tones.a.ink).toBe('#FFFFFF');
    expect(t.tones.b.ink).toBe('#111111');
  });

  it('se rabat sur le blanc ou le noir quand la palette n’offre rien de lisible', () => {
    const t = buildTheme({ ...base, page: '#777777', ink: '#888888', surface: '#808080', accent: '#7F7F7F' });
    expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('écrit à l’encre un avertissement ou un statut illisible sur la page', () => {
    const t = buildTheme({ ...base, warn: '#FFEE88', wip: '#FFF3B0' });
    expect(t.warnFg).toBe(base.ink);
    expect(t.statusFg.wip).toBe(base.ink);
    expect(t.statusFg.live).toBe(base.live);
  });

  it('garde les cartes sombres en mode sombre, la couleur passant au liseré', () => {
    const t = buildTheme({ ...base, mode: 'dark', page: '#000000', surface: '#111111', ink: '#FFFFFF' });
    expect(t.tones.a).toMatchObject({ bg: '#111111', ink: '#FFFFFF', border: '#0044CC', dot: '#0044CC' });
  });
});

describe('les thèmes construits', () => {
  Object.keys(PALETTES).forEach((key) => {
    const t = THEMES[key];

    it(`${key} : chaque texte se lit sur son fond`, () => {
      expect(contrast(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.pills.live.fg, t.pills.live.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.pills.wip.fg, t.pills.wip.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.inkSoft, t.page)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.warnFg, t.page)).toBeGreaterThanOrEqual(4.5);
      (['a', 'b', 'c', 'd'] as const).forEach((k) => {
        expect(contrast(t.tones[k].ink, t.tones[k].bg)).toBeGreaterThanOrEqual(4.5);
      });
    });

    it(`${key} : l’accent se détache de l’en-tête, les statuts de la page`, () => {
      expect(contrast(t.accent, t.primary)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.statusFg.live, t.page)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.statusFg.wip, t.page)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.inkFaint, t.page)).toBeGreaterThanOrEqual(3);
      (['a', 'b', 'c'] as const).forEach((k) => {
        expect(contrast(t.tones[k].dot, t.surface)).toBeGreaterThanOrEqual(3);
      });
    });

    it(`${key} : chaque nuancier montre une couleur déclarée par le projet`, () => {
      expect(t.swatches.length).toBeGreaterThan(0);
      t.swatches.forEach((w) => expect(w.title.toLowerCase()).toContain(w.hex.toLowerCase()));
    });
  });
});
