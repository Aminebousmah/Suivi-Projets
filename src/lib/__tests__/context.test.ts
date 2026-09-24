import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildLiveContext,
  cleanInline,
  describeFile,
  detectStatus,
  formatSize,
  listItems,
  parseChecklist,
  parseNever,
  parsePhases,
  parseRules,
  splitSections,
} from '../context';

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8');

const CLAUDE = fixture('claude.md');
const PLAN = fixture('plan.md');

describe('splitSections', () => {
  it('découpe sur les titres et garde leur niveau', () => {
    const s = splitSections(CLAUDE);
    expect(s[0].heading).toBe('Sole Citron — contexte projet');
    expect(s[0].level).toBe(1);
    expect(s.map((x) => x.heading)).toContain('Conventions de code');
  });

  it('ignore un titre pris dans un bloc de code', () => {
    const headings = splitSections(CLAUDE).map((s) => s.heading);
    expect(headings).not.toContain('Règles');
  });
});

describe('cleanInline', () => {
  it('retire gras, italique, code et liens', () => {
    expect(cleanInline('Modifier les **tokens** ou le `config`')).toBe(
      'Modifier les tokens ou le config',
    );
    expect(cleanInline('voir [la doc](https://exemple.fr) ici')).toBe('voir la doc ici');
    expect(cleanInline('un mot en *italique* ici')).toBe('un mot en italique ici');
  });

  it('laisse intacte une expression avec astérisques collés', () => {
    expect(cleanInline('le motif src/config/*')).toBe('le motif src/config/*');
  });
});

describe('listItems', () => {
  it('lit les puces et les listes numérotées', () => {
    const items = listItems(splitSections(CLAUDE).find((s) => s.heading === 'Workflow attendu')!.lines);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatch(/^Lire ce fichier en premier/);
  });

  it('ne lit pas les lignes des blocs de code', () => {
    const section = splitSections(CLAUDE).find((s) => s.heading === 'Exemple à ne pas confondre')!;
    expect(listItems(section.lines)).toEqual([]);
  });
});

describe('parseRules', () => {
  const rules = parseRules(CLAUDE);

  it('récolte les règles des sections qui en parlent', () => {
    expect(rules).toContain('Modifier les tokens ou les configs plutôt que les composants.');
    expect(rules).toContain('Mini-récap et liste des fichiers touchés à la fin de chaque tâche.');
  });

  it("n'y mélange pas les interdits", () => {
    expect(rules.some((r) => /Jamais de hex/.test(r))).toBe(false);
    expect(rules.some((r) => /Commit, push ou PR/.test(r))).toBe(false);
  });

  it('ignore les sections sans rapport', () => {
    expect(rules.some((r) => /tokens.css/.test(r))).toBe(false);
  });
});

describe('parseNever', () => {
  const never = parseNever(CLAUDE);

  it('reprend la section dédiée en entier', () => {
    expect(never).toContain('Commit, push ou PR de manière autonome.');
    expect(never).toContain('CSS inline, sauf valeurs dynamiques liées aux props.');
  });

  it('rattrape une interdiction formulée ailleurs', () => {
    expect(never).toContain('Jamais de hex codé en dur dans un composant.');
  });

  it('ne répète pas deux fois le même interdit', () => {
    expect(new Set(never).size).toBe(never.length);
  });
});

describe('detectStatus', () => {
  it.each([
    ['Phase 1 — Foundation ✅', 'live'],
    ['Les 10 portes — en ligne', 'live'],
    ['Phase 2 : Boutique (fait)', 'live'],
    ['Pivot 🚧', 'wip'],
    ['Phase 5 — Post-lancement 💡', 'idea'],
    ['Phase 4 — à venir', 'frozen'],
  ])('lit « %s » comme %s', (text, expected) => {
    expect(detectStatus(text)?.status).toBe(expected);
  });

  it('ne devine rien sur un titre muet', () => {
    expect(detectStatus('Phase 4 — Commerce')).toBeNull();
  });
});

describe('parsePhases', () => {
  const phases = parsePhases(PLAN);

  it('ne retient que les titres de phase', () => {
    expect(phases).toHaveLength(5);
    expect(phases.map((p) => p.num)).toEqual([
      'Phase 1',
      'Phase 2',
      'Pivot',
      'Phase 4',
      'Phase 5',
    ]);
  });

  it('sépare le numéro du titre et retire les marqueurs', () => {
    expect(phases[0].title).toBe('Foundation et home');
    expect(phases[1].title).toBe('Boutique et savoir');
    expect(phases[2].title).toBe('Passage en mode éditorial');
  });

  it('lit le statut dans le titre, sinon dans les cases à cocher', () => {
    // La Phase 4 n'a pas de marqueur, mais une case cochée sur trois.
    expect(phases.map((p) => p.tone)).toEqual(['live', 'live', 'wip', 'wip', 'idea']);
  });

  it('retient « à venir » quand aucun statut ne se lit', () => {
    const [p] = parsePhases('## Phase 9 — Refonte du tableau de bord\n\nRien de décidé.');
    expect(p.status).toBe('à venir');
    expect(p.tone).toBe('frozen');
  });

  it('prend le premier paragraphe comme détail', () => {
    expect(phases[0].detail).toBe(
      'Astro 5 et TS strict, tokens CSS complets, sept composants UI.',
    );
    expect(phases[0].detail).not.toMatch(/ne pas reprendre/);
  });

  it('accepte une liste comme détail', () => {
    expect(phases[3].detail).toMatch(/Compte Snipcart/);
  });

  it('ne rend rien sur un plan vide', () => {
    expect(parsePhases('')).toEqual([]);
  });
});

describe('ce que font vraiment les projets', () => {
  // Formes relevées dans des CLAUDE.md et plan.md réels, reproduites ici.

  it('lit ✓ comme « fait » et le retire du titre', () => {
    const [p] = parsePhases('## Phase 1 — Foundation + Home ✓\n\n- [x] Socle');
    expect(p.tone).toBe('live');
    expect(p.title).toBe('Foundation + Home');
  });

  it('retire un statut en capitales accolé au titre', () => {
    const [p] = parsePhases('## Phase 1 — Compléter les données ⏳ EN COURS\n\nTexte.');
    expect(p.tone).toBe('wip');
    expect(p.title).toBe('Compléter les données');
  });

  it('lit un avancement chiffré dans le titre', () => {
    const [p] = parsePhases('## 🔬 Phase 1 — Pipeline ML *(90 %)*\n\nTexte.');
    expect(p.tone).toBe('wip');
    expect(p.title).toBe('Pipeline ML');
    expect(p.num).toBe('Phase 1');
  });

  it('tire le statut des cases quand le titre n’en porte pas', () => {
    const toutes = parsePhases('## Phase 7 — Billing\n\n- [x] Stripe\n- [x] Quotas');
    const aucune = parsePhases('## Phase 8 — Suite\n\n- [ ] Une\n- [ ] Deux');
    expect(toutes[0].tone).toBe('live');
    expect(aucune[0].tone).toBe('frozen');
  });

  it('ne prend pas « Phase actuelle » pour une phase', () => {
    const phases = parsePhases(
      '## 📌 Phase actuelle\n\nEN PRODUCTION.\n\n## Phase 0 — Socle ✅\n\nFait.',
    );
    expect(phases.map((p) => p.num)).toEqual(['Phase 0']);
  });

  it('lit les consignes rangées en sous-sections', () => {
    const md = [
      '## Règles pour Claude Code',
      '### Toujours',
      '- Lancer les tests avant de committer.',
      '### Jamais',
      '- Pousser sur main sans relecture.',
      '## Conventions de code',
      '### Python',
      '- Typage strict partout.',
    ].join('\n');
    expect(parseRules(md)).toEqual([
      'Lancer les tests avant de committer.',
      'Typage strict partout.',
    ]);
    expect(parseNever(md)).toEqual(['Pousser sur main sans relecture.']);
  });

  it('lit une section « Contraintes » comme des règles', () => {
    expect(parseRules('## Contraintes & décisions\n\n- Tout tourne en local.')).toEqual([
      'Tout tourne en local.',
    ]);
  });
});

describe('parseChecklist', () => {
  it('sépare les cases cochées des autres', () => {
    const { done, todo } = parseChecklist(PLAN);
    expect(done).toEqual(['Pages placeholder « Bientôt »']);
    expect(todo).toEqual(['Compte Snipcart et clé dans Vercel', 'Mentions légales complétées']);
  });

  it('ignore les puces sans case', () => {
    expect(parseChecklist('- juste une puce')).toEqual({ done: [], todo: [] });
  });
});

describe('describeFile', () => {
  it('résume un fichier par sa première phrase et ses sections', () => {
    const d = describeFile({ path: 'CLAUDE.md', text: CLAUDE, bytes: 1234 }, 'a');
    expect(d.name).toBe('CLAUDE.md');
    expect(d.size).toBe('1,2 ko');
    expect(d.role).toBe('Site éditorial consacré au citron, construit avec Astro 5.');
    expect(d.chips).toContain('Conventions de code');
    expect(d.chips.length).toBeLessThanOrEqual(6);
  });

  it('recolle un paragraphe passé à la ligne', () => {
    const md = '# Titre\n\nUne phrase coupée\nsur deux lignes.\n\nUn autre paragraphe.';
    expect(describeFile({ path: 'X.md', text: md, bytes: 10 }, 'a').role).toBe(
      'Une phrase coupée sur deux lignes.',
    );
  });

  it('retire les marqueurs de statut des sections listées', () => {
    const md = '# T\n\nIntro.\n\n## Phase 1 — Socle ✅\n\n## Phase 2 — Suite 🚧';
    expect(describeFile({ path: 'plan.md', text: md, bytes: 10 }, 'a').chips).toEqual([
      'Phase 1 — Socle',
      'Phase 2 — Suite',
    ]);
  });
});

describe('formatSize', () => {
  it.each([
    [512, '512 o'],
    [1234, '1,2 ko'],
    [14000, '14,0 ko'],
  ])('%i octets → %s', (bytes, expected) => {
    expect(formatSize(bytes)).toBe(expected);
  });
});

describe('buildLiveContext', () => {
  it('assemble ce que les trois fichiers disent', () => {
    const ctx = buildLiveContext([
      { path: 'CLAUDE.md', text: CLAUDE, bytes: 900 },
      { path: 'plan.md', text: PLAN, bytes: 600 },
      null,
    ]);

    expect(ctx.found).toEqual(['CLAUDE.md', 'plan.md']);
    expect(ctx.absent).toEqual(['README.md']);
    expect(ctx.ctxFiles).toHaveLength(2);
    expect(ctx.phases).toHaveLength(5);
    expect(ctx.ctxRules.length).toBeGreaterThan(3);
    expect(ctx.ctxNever.length).toBeGreaterThan(2);
    expect(ctx.todo).toContain('Mentions légales complétées');
  });

  it('reste vide et silencieux quand rien n’est trouvé', () => {
    const ctx = buildLiveContext([null, null, null]);
    expect(ctx.found).toEqual([]);
    expect(ctx.absent).toEqual(['CLAUDE.md', 'plan.md', 'README.md']);
    expect(ctx.unreadable).toEqual([]);
    expect(ctx.ctxFiles).toEqual([]);
    expect(ctx.phases).toEqual([]);
    expect(ctx.ctxRules).toEqual([]);
  });

  it('distingue un fichier absent d’un fichier non lu', () => {
    const ctx = buildLiveContext([
      { path: 'CLAUDE.md', text: CLAUDE, bytes: 900 },
      { failed: true },
      null,
    ]);

    expect(ctx.found).toEqual(['CLAUDE.md']);
    expect(ctx.unreadable).toEqual(['plan.md']);
    expect(ctx.absent).toEqual(['README.md']);
    // Un plan non lu ne doit pas faire croire à un projet sans phases décrites.
    expect(ctx.phases).toEqual([]);
    expect(ctx.ctxRules.length).toBeGreaterThan(0);
  });
});
