/**
 * Lisibilité des couleurs du thème.
 *
 * Les tons d'un dépôt servent tantôt de fond, tantôt de texte : un même « ton
 * a » est bleu cobalt chez Sole-Citron, vert vif chez Eleven-Fields, presque
 * noir chez Atlas. Choisir l'encre à la main, dépôt par dépôt, a déjà produit un
 * texte noir sur fond noir. On la choisit donc par le calcul : parmi les
 * couleurs du thème, celle qui contraste le plus avec le fond.
 */

type Rgba = [number, number, number, number];

/** Lit #RGB, #RRGGBB ou rgba(r, g, b, a). Renvoie null sur tout le reste. */
export function parseColor(color: string): Rgba | null {
  const c = color.trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((x) => x + x).join('') : hex[1];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      1,
    ];
  }

  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(c);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
  }

  return null;
}

/** Une couleur translucide, posée sur un fond, telle que l'œil la voit. */
function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3];
  return [
    top[0] * a + bottom[0] * (1 - a),
    top[1] * a + bottom[1] * (1 - a),
    top[2] * a + bottom[2] * (1 - a),
    1,
  ];
}

/** Luminance relative, au sens des WCAG. */
function luminanceOf([r, g, b]: Rgba): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Rapport de contraste entre un texte et son fond, de 1 à 21. */
export function contrast(ink: string, background: string): number {
  const bg = parseColor(background);
  const fg = parseColor(ink);
  if (!bg || !fg) return 1;
  const solidBg = bg[3] < 1 ? over(bg, [255, 255, 255, 1]) : bg;
  const l1 = luminanceOf(over(fg, solidBg));
  const l2 = luminanceOf(solidBg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Parmi les encres proposées, celle qui se lit le mieux sur ce fond. */
export function readableOn(background: string, candidates: string[]): string {
  let best = candidates[0];
  let bestRatio = -1;
  candidates.forEach((ink) => {
    const ratio = contrast(ink, background);
    if (ratio > bestRatio) {
      best = ink;
      bestRatio = ratio;
    }
  });
  return best;
}
