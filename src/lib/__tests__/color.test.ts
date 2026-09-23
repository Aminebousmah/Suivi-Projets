import { describe, expect, it } from 'vitest';
import { THEMES } from '../../data/themes';
import { contrast, parseColor, readableOn } from '../color';

describe('parseColor', () => {
  it('lit les notations hexadécimales courtes et longues', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255, 1]);
    expect(parseColor('#0E3FB5')).toEqual([14, 63, 181, 1]);
  });

  it('lit rgb et rgba', () => {
    expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30, 1]);
    expect(parseColor('rgba(10,26,63,0.45)')).toEqual([10, 26, 63, 0.45]);
  });

  it('refuse ce qui n’est pas une couleur lisible', () => {
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('#12')).toBeNull();
  });
});

describe('contrast', () => {
  it('donne 21 pour le noir sur le blanc, 1 pour une couleur sur elle-même', () => {
    expect(contrast('#000', '#fff')).toBeCloseTo(21, 0);
    expect(contrast('#0E3FB5', '#0E3FB5')).toBeCloseTo(1, 5);
  });

  it('tient compte de la transparence de l’encre', () => {
    const plein = contrast('#000000', '#ffffff');
    const voile = contrast('rgba(0,0,0,0.3)', '#ffffff');
    expect(voile).toBeLessThan(plein);
    expect(voile).toBeGreaterThan(1);
  });

  it('rend 1 quand une des couleurs est illisible', () => {
    expect(contrast('transparent', '#fff')).toBe(1);
  });
});

describe('readableOn', () => {
  it('choisit l’encre claire sur un fond sombre, et inversement', () => {
    expect(readableOn('#101014', ['#101014', '#FAFAF8'])).toBe('#FAFAF8');
    expect(readableOn('#00FF99', ['#FFFFFF', '#0E1117'])).toBe('#0E1117');
  });

  it.each(Object.keys(THEMES))(
    '%s : chaque ton se lit sur lui-même avec une encre du thème',
    (key) => {
      const t = THEMES[key];
      Object.values(t.tones).forEach((tone) => {
        const ink = readableOn(tone.dot, [tone.ink, t.page, t.ink, t.onAccent]);
        // 3:1, le seuil WCAG des gros textes et des éléments d'interface
        expect(contrast(ink, tone.dot)).toBeGreaterThanOrEqual(3);
      });
    },
  );
});
