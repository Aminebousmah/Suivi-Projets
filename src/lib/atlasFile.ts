import type { Domain, Feature, Status, ToneKey, TrackingRow } from '../data/types';
import { cleanInline, detectStatus, splitSections } from './context';
import type { Section } from './context';
import type { TextFile } from './github';

/**
 * Lecture d'`atlas.md`, le fichier de suivi qu'un projet peut fournir.
 *
 * C'est la seule source qui porte du sens fonctionnel : ni l'arborescence ni
 * l'historique git ne disent à quoi sert un fichier, ni où en est une
 * fonctionnalité. Un dépôt qui écrit ce fichier décrit lui-même son arbre, au
 * lieu de le voir écrit en dur dans `src/data/repos.ts`.
 *
 * ATLAS-PROMPT.md donne le format et le prompt qui le produit. La lecture reste
 * tolérante : ce qui ne suit pas le format est laissé de côté, jamais deviné.
 */

export const ATLAS_FILE = 'atlas.md';

const DOMAIN_HEADING = /^domaines?\b/i;
const TRACKING_HEADING = /^suivi\b/i;
const DOES_HEADING = /^(fait|ce que le projet fait)\b/i;
const TODO_HEADING = /^(à faire|a faire|ce qu'il reste)\b/i;

const SPLIT = /\s*(?:·|—|–|:|\|)\s*/;
const TONES: ToneKey[] = ['a', 'b', 'c', 'd'];

/** Retire le marqueur de statut d'un titre de fonctionnalité. */
function withoutStatus(heading: string): string {
  return heading
    .replace(/\s*[—–-]\s*(en ligne|en cours|gel[ée]e?|id[ée]e?s?|fait|à venir|✅|🚧|⏳|💡)\s*$/i, '')
    .replace(/[✅🚧⏳💡]/gu, '')
    .trim();
}

/** Première ligne de texte d'une section : ce que la chose fait. */
function leadOf(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^([-*+>|]|\d+[.)]|```|~~~|#)/.test(trimmed)) break;
    return cleanInline(trimmed);
  }
  return '';
}

/**
 * Chemins cités : les items de liste, le balisage `code` étant facultatif.
 *
 * Un chemin entre accents graves est pris tel quel, sans nettoyage : sinon
 * `src/lib/__tests__/x.ts` ou `__init__.py` perdraient leurs tirets bas, que le
 * Markdown lit comme du gras.
 */
function filesOf(lines: string[]): string[] {
  const out: string[] = [];
  lines.forEach((line) => {
    const m = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (!m) return;
    const code = /^`([^`]+)`$/.exec(m[1].trim());
    const text = code ? code[1].trim() : cleanInline(m[1]);
    if (text) out.push(text);
  });
  return out;
}

/** Notes : les lignes de citation, celles qu'un lecteur ne devinerait pas. */
function notesOf(lines: string[]): string[] {
  const out: string[] = [];
  lines.forEach((line) => {
    const m = /^\s*>\s?(.*)$/.exec(line);
    if (!m) return;
    const text = cleanInline(m[1]);
    if (text) out.push(text);
  });
  return out;
}

/** Lignes d'un tableau Markdown, séparateur d'en-tête exclu. */
export function tableRows(lines: string[]): string[][] {
  return lines
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && !/^\|[\s|:-]+\|?$/.test(l))
    .map((l) =>
      l
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => cleanInline(c)),
    );
}

function toTracking(rows: string[][]): TrackingRow[] {
  return rows
    .slice(1) // la première ligne est l'en-tête
    .filter((r) => r.length >= 2 && r[0])
    .map((r) => {
      const pct = (r[3] ?? '').match(/(\d+(?:[.,]\d+)?)\s*%/);
      const value = pct ? Number(pct[1].replace(',', '.')) : null;
      const tone: Status =
        value === null ? 'idea' : value >= 100 ? 'live' : value > 0 ? 'wip' : 'frozen';
      return {
        k: r[0],
        v: r[1] ?? '—',
        target: r[2] ?? '—',
        pct: value === null ? '0%' : Math.max(0, Math.min(100, value)) + '%',
        tone,
      };
    });
}

export interface AtlasDoc {
  title: string;
  tagline: string;
  domains: Domain[];
  tracking: TrackingRow[];
  does: string[];
  todo: string[];
}

/** Regroupe les sections d'un niveau donné sous celle qui les précède. */
function childrenOf(sections: Section[], start: number, level: number): Section[] {
  const out: Section[] = [];
  for (let i = start; i < sections.length; i++) {
    if (sections[i].level <= level) break;
    if (sections[i].level === level + 1) out.push(sections[i]);
  }
  return out;
}

/**
 * Lit un `atlas.md`. Renvoie null quand le fichier ne décrit aucun domaine :
 * un fichier hors format n'est pas une panne, c'est un fichier qu'on n'utilise
 * pas.
 */
export function parseAtlasFile(file: TextFile): AtlasDoc | null {
  const sections = splitSections(file.text);

  const title = sections.find((s) => s.level === 1)?.heading ?? '';
  const tagline = leadOf(sections.find((s) => s.level === 1)?.lines ?? []);

  const domains: Domain[] = [];
  let tracking: TrackingRow[] = [];
  let does: string[] = [];
  let todo: string[] = [];

  sections.forEach((section, index) => {
    if (section.level !== 2) return;
    const heading = cleanInline(section.heading);

    if (TRACKING_HEADING.test(heading)) {
      tracking = toTracking(tableRows(section.lines));
      return;
    }
    if (DOES_HEADING.test(heading)) {
      does = filesOf(section.lines);
      return;
    }
    if (TODO_HEADING.test(heading)) {
      todo = filesOf(section.lines);
      return;
    }
    if (!DOMAIN_HEADING.test(heading)) return;

    const name = heading.split(SPLIT).slice(1).join(' · ').trim() || heading;
    const features: Feature[] = childrenOf(sections, index + 1, 2).map((child) => {
      const found = detectStatus(child.heading);
      return {
        name: withoutStatus(cleanInline(child.heading)),
        status: found?.status ?? 'idea',
        what: leadOf(child.lines),
        files: filesOf(child.lines),
        notes: notesOf(child.lines),
      };
    });

    domains.push({
      key: name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, ''),
      num: String(domains.length + 1).padStart(2, '0'),
      name,
      tone: TONES[domains.length % TONES.length],
      role: leadOf(section.lines),
      detail: leadOf(section.lines),
      features,
    });
  });

  if (!domains.length) return null;
  return { title, tagline, domains, tracking, does, todo };
}

/**
 * Reprend les clés des domaines déjà décrits dans les données quand atlas.md
 * les nomme pareil : un permalien reste valable une fois le fichier lu, et la
 * sélection ne saute pas quand l'arbre passe de la description figée au fichier.
 */
export function alignDomainKeys(live: Domain[], reference: Domain[]): Domain[] {
  const norm = (name: string) => name.trim().toLowerCase();
  const byName = new Map(reference.map((d) => [norm(d.name), d.key]));
  return live.map((d) => {
    const key = byName.get(norm(d.name));
    return key && key !== d.key ? { ...d, key } : d;
  });
}
