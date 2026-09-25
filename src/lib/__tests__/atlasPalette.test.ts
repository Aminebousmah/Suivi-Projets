import { describe, expect, it } from 'vitest';
import { NEUTRAL_THEME, THEMES } from '../../data/themes';
import { googleFontHref, paletteSpecFrom, parsePalette } from '../atlasPalette';
import { contrast } from '../color';
import { buildTheme, themeFor } from '../palette';

const TABLE = `# Atlas — Clip&Core

Des clips.

## Domaine · Socle

### Rendu — en ligne
Rend.
- \`src/app.ts\`

## Direction artistique

| Rôle | Couleur | Usage |
| --- | --- | --- |
| Fond de page | \`#FFF4E5\` | crème |
| Cartes | \`#FFFFFF\` | |
| Encre | \`#2F1C11\` | texte principal |
| Encre douce | \`#6B4F3A\` | texte secondaire |
| En-tête | \`#3B2416\` | brun |
| Accent | \`#F3BBC8\` | rose |
| Bleu | \`#1746D1\` | action |
| Ciel | \`#A9D4F5\` | |
| Police des titres | DynaPuff | arrondie |
`;

const LIST = `## Charte

- Mode : sombre
- Fond : #0a0b0f
- Encre : #f0f1f5
- Accent : #8b5cf6
- Police des titres : Space Grotesk
`;

describe('parsePalette', () => {
  it('lit un tableau : rôles, couleurs et police', () => {
    const p = parsePalette(TABLE)!;
    expect(p.display).toBe('DynaPuff');
    expect(p.entries.map((e) => [e.role, e.hex])).toEqual([
      ['page', '#FFF4E5'],
      ['surface', '#FFFFFF'],
      ['ink', '#2F1C11'],
      ['inkSoft', '#6B4F3A'],
      ['primary', '#3B2416'],
      ['accent', '#F3BBC8'],
      ['brand', '#1746D1'],
      ['brand', '#A9D4F5'],
    ]);
  });

  it('lit une liste, et le mode déclaré', () => {
    const p = parsePalette(LIST)!;
    expect(p.mode).toBe('dark');
    expect(p.display).toBe('Space Grotesk');
    expect(p.entries.map((e) => e.role)).toEqual(['page', 'ink', 'accent']);
  });

  it('ne trouve rien sans section, ou sans couleur', () => {
    expect(parsePalette('# Titre\n\n## Suivi\n| a | b |')).toBeNull();
    expect(parsePalette('## Direction artistique\n\nDes formes rondes.')).toBeNull();
  });

  it('ne prend pas la section pour un domaine', () => {
    expect(parsePalette(TABLE)).not.toBeNull();
  });
});

describe('paletteSpecFrom', () => {
  it('complète la palette en un thème lisible', () => {
    const t = buildTheme(paletteSpecFrom(parsePalette(TABLE)!)!);
    expect(t.page).toBe('#FFF4E5');
    expect(t.primary).toBe('#3B2416');
    expect(t.tones.a.bg).toBe('#1746D1');
    expect(t.display).toContain('DynaPuff');
    expect(contrast(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
    t.swatches.forEach((w) => expect(w.title).toContain(w.hex));
  });

  it('déduit le mode sombre du fond et y pose l’en-tête sur la surface', () => {
    const spec = paletteSpecFrom(parsePalette(LIST.replace('- Mode : sombre\n', ''))!)!;
    expect(spec.mode).toBe('dark');
    expect(spec.primary).toBe(spec.surface);
  });

  it('refuse une palette sans fond, encre ou accent', () => {
    expect(paletteSpecFrom(parsePalette('## Palette\n- Fond : #FFFFFF\n- Encre : #000000')!)).toBeNull();
  });
});

describe('themeFor', () => {
  it('préfère la palette déclarée, puis la copie, puis le neutre', () => {
    const declared = parsePalette(TABLE);
    expect(themeFor(THEMES.clipcore, declared, NEUTRAL_THEME).source).toBe('palette lue dans atlas.md');
    expect(themeFor(THEMES.clipcore, null, NEUTRAL_THEME)).toBe(THEMES.clipcore);
    expect(themeFor(undefined, null, NEUTRAL_THEME)).toBe(NEUTRAL_THEME);
  });

  it('garde la copie quand la palette déclarée est incomplète', () => {
    const partial = parsePalette('## Palette\n- Fond : #FFFFFF');
    expect(themeFor(THEMES.clipcore, partial, NEUTRAL_THEME)).toBe(THEMES.clipcore);
  });
});

describe('googleFontHref', () => {
  it('demande la famille à Google Fonts, et rien d’autre', () => {
    expect(googleFontHref('Space Grotesk')).toBe(
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap',
    );
  });

  it('ignore les polices système et les noms suspects', () => {
    expect(googleFontHref(null)).toBeNull();
    expect(googleFontHref('Georgia')).toBeNull();
    expect(googleFontHref('x"><script>')).toBeNull();
  });
});
