import type { CtxFile, Phase, Status, ToneKey } from '../data/types';
import type { TextFile } from './github';

/**
 * Lecture des fichiers de contexte d'un dépôt — CLAUDE.md, plan.md, README.md.
 *
 * Ces fichiers sont écrits pour des humains : aucun schéma n'est garanti. Les
 * analyses qui suivent sont donc « au mieux » et ne devinent rien — ce qu'elles
 * ne reconnaissent pas, elles le laissent de côté plutôt que de l'inventer.
 */

export interface Section {
  heading: string;
  level: number;
  lines: string[];
}

/** Découpe un Markdown en sections, en ignorant les titres pris dans un bloc de code. */
export function splitSections(md: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { heading: '', level: 0, lines: [] };
  let inFence = false;

  md.split(/\r?\n/).forEach((line) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;

    const m = !inFence ? /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line) : null;
    if (m) {
      if (current.heading || current.lines.length) sections.push(current);
      current = { heading: m[2].trim(), level: m[1].length, lines: [] };
    } else {
      current.lines.push(line);
    }
  });

  if (current.heading || current.lines.length) sections.push(current);
  return sections;
}

/** Retire le balisage inline pour rendre un item lisible tel quel. */
export function cleanInline(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(^|[\s(])[*_](\S(?:.*?\S)?)[*_]($|[\s,.);:])/g, '$1$2$3')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const BULLET = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/;
const CHECKBOX = /^\[([ xX])\]\s*(.*)$/;

/** Items de liste d'un bloc de lignes, cases à cocher comprises. */
export function listItems(lines: string[]): string[] {
  const items: string[] = [];
  let inFence = false;

  lines.forEach((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const m = BULLET.exec(line);
    if (!m) return;
    const box = CHECKBOX.exec(m[1]);
    const text = cleanInline(box ? box[2] : m[1]);
    if (text) items.push(text);
  });

  return items;
}

const RULE_HEADING = /r[èe]gle|convention|workflow|process|principe|guideline|m[ée]thode|à faire/i;
const NEVER_HEADING = /jamais|interdit|interdiction|ne pas|never|don'?t|anti-?pattern|à [ée]viter/i;
const NEVER_ITEM = /^(?:ne\s+)?jamais\b|^ne\s+pas\b|^[ée]viter\b|^pas\s+de\b|^aucun[e]?\s/i;

/** Règles actives : les listes des sections qui en parlent, hors interdits. */
export function parseRules(md: string): string[] {
  const out: string[] = [];
  splitSections(md).forEach((s) => {
    if (!RULE_HEADING.test(s.heading) || NEVER_HEADING.test(s.heading)) return;
    listItems(s.lines).forEach((item) => {
      if (!NEVER_ITEM.test(item)) out.push(item);
    });
  });
  return dedupe(out);
}

/** Interdits : sections dédiées, plus les items formulés comme une interdiction. */
export function parseNever(md: string): string[] {
  const out: string[] = [];
  splitSections(md).forEach((s) => {
    const dedicated = NEVER_HEADING.test(s.heading);
    listItems(s.lines).forEach((item) => {
      if (dedicated || NEVER_ITEM.test(item)) out.push(item);
    });
  });
  return dedupe(out);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Les limites de mot \b de JavaScript sont ASCII : elles ne se posent pas
 * autour de « à » ou « é ». Ces gardes Unicode les remplacent, sans quoi
 * « à venir » ou « terminé » ne seraient jamais reconnus.
 */
const A = '(?<![\\p{L}])';
const Z = '(?![\\p{L}])';
const word = (...alts: string[]) => new RegExp(A + '(?:' + alts.join('|') + ')' + Z, 'iu');

const STATUS_RULES: { status: Status; label: string; test: RegExp }[] = [
  { status: 'live', label: 'fait', test: word('✅', '✔', '☑', 'faits?', 'termin[ée]e?s?', 'livr[ée]e?s?', 'done', 'ok') },
  { status: 'wip', label: 'en cours', test: word('🚧', '🔨', '⚙', 'en cours', 'wip', 'in progress', 'd[ée]marr[ée]e?') },
  { status: 'idea', label: 'idées', test: word('💡', 'id[ée]es?', 'backlog', 'exploratoire', 'plus tard', 'peut-[êe]tre') },
  { status: 'frozen', label: 'à venir', test: word('⏳', '🧊', '❄', 'à venir', 'pr[ée]vue?s?', 'planifi[ée]e?', 'gel[ée]e?', 'bloqu[ée]e?', 'todo', 'pas commenc[ée]e?') },
];

/** Devine le statut d'une phase depuis son titre ou ses premières lignes. */
export function detectStatus(text: string): { status: Status; label: string } | null {
  for (const rule of STATUS_RULES) {
    if (rule.test.test(text)) return { status: rule.status, label: rule.label };
  }
  return null;
}

const PHASE_HEADING = /^[^\w]*(phase|[ée]tape|etape|pivot|sprint|jalon|lot)\b/i;
const SPLIT = /\s*(?:—|–|:|·|\||-{1,2}\s)\s*/;

/**
 * Phases d'un plan.md : un titre par phase, un statut lu dans le titre ou juste
 * en dessous, et le premier paragraphe comme détail. Un titre sans statut
 * reconnaissable reste « à venir » plutôt que d'être écarté.
 */
export function parsePhases(md: string): Phase[] {
  return splitSections(md)
    .filter((s) => PHASE_HEADING.test(s.heading))
    .map((s) => {
      const heading = cleanInline(s.heading);
      const body = s.lines.filter((l) => l.trim()).slice(0, 4).join(' ');
      const found = detectStatus(heading) ?? detectStatus(body);

      const parts = heading.split(SPLIT);
      const num = cleanStatusWords(parts[0]);
      const title = cleanStatusWords(parts.slice(1).join(' — ')) || num;

      const paragraph: string[] = [];
      for (const line of s.lines) {
        if (!line.trim()) {
          if (paragraph.length) break;
          continue;
        }
        if (/^\s*(```|~~~|#)/.test(line)) break;
        paragraph.push(cleanInline(line.replace(BULLET, '$1')));
      }

      return {
        num,
        title,
        status: found?.label ?? 'à venir',
        tone: found?.status ?? 'frozen',
        detail: paragraph.join(' ').trim(),
      };
    });
}

/** Retire les marqueurs de statut d'un titre pour n'en garder que le texte. */
export function cleanStatusWords(text: string): string {
  return text
    .replace(/[✅✔☑🚧🔨⚙⏳🧊❄💡]/gu, '')
    .replace(/\((?:fait|termin[ée]e?|en cours|à venir|gel[ée]e?|id[ée]es?|done|wip|todo)\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cases cochées et non cochées d'un Markdown, dans l'ordre du document. */
export function parseChecklist(md: string): { done: string[]; todo: string[] } {
  const done: string[] = [];
  const todo: string[] = [];
  let inFence = false;

  md.split(/\r?\n/).forEach((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const bullet = BULLET.exec(line);
    if (!bullet) return;
    const box = CHECKBOX.exec(bullet[1]);
    if (!box) return;
    const text = cleanInline(box[2]);
    if (!text) return;
    (box[1].toLowerCase() === 'x' ? done : todo).push(text);
  });

  return { done, todo };
}

/** Résumé d'un fichier de contexte : sa taille réelle et ses grandes sections. */
export function describeFile(file: TextFile, tone: ToneKey): CtxFile {
  const sections = splitSections(file.text);

  // Le résumé est le premier vrai paragraphe, pas sa première ligne : un texte
  // passé à la ligne ne doit pas être tronqué au milieu d'une phrase.
  const paragraph: string[] = [];
  for (const line of sections.flatMap((s) => s.lines)) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (paragraph.length) break;
      continue;
    }
    if (/^[-*+>|]|^\d+[.)]|^(```|~~~|<)/.test(trimmed)) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(trimmed);
  }
  const intro = paragraph.join(' ');

  const chips = sections
    .filter((s) => s.level === 2 && s.heading)
    .map((s) => cleanStatusWords(cleanInline(s.heading)))
    .slice(0, 6);

  return {
    name: file.path,
    size: formatSize(file.bytes),
    tone,
    role: intro ? cleanInline(intro) : 'Fichier présent, sans résumé en tête.',
    chips,
  };
}

export function formatSize(bytes: number): string {
  if (bytes >= 1000) return (bytes / 1000).toFixed(1).replace('.', ',') + ' ko';
  return bytes + ' o';
}

export interface LiveContext {
  ctxFiles: CtxFile[];
  ctxRules: string[];
  ctxNever: string[];
  phases: Phase[];
  done: string[];
  todo: string[];
  /** Fichiers effectivement trouvés, dans l'ordre de lecture. */
  found: string[];
  /** Fichiers cherchés et absents du dépôt. */
  absent: string[];
  /** Fichiers présents peut-être, mais que GitHub n'a pas rendus. */
  unreadable: string[];
}

export const CONTEXT_FILES = ['CLAUDE.md', 'plan.md', 'README.md'];
const TONES: ToneKey[] = ['a', 'b', 'd'];

/** Ce qu'une tentative de lecture a donné : le fichier, son absence, ou un échec. */
export type FileResult = TextFile | null | { failed: true };

function isFile(r: FileResult): r is TextFile {
  return !!r && !('failed' in r);
}

/** Assemble ce que les fichiers de contexte disent du projet. */
export function buildLiveContext(files: FileResult[]): LiveContext {
  const claude = isFile(files[0]) ? files[0] : null;
  const plan = isFile(files[1]) ? files[1] : null;
  const readme = isFile(files[2]) ? files[2] : null;

  const ctxFiles: CtxFile[] = [];
  const found: string[] = [];
  const absent: string[] = [];
  const unreadable: string[] = [];

  files.forEach((f, i) => {
    if (isFile(f)) {
      ctxFiles.push(describeFile(f, TONES[i] ?? 'd'));
      found.push(f.path);
    } else if (f && 'failed' in f) {
      unreadable.push(CONTEXT_FILES[i]);
    } else {
      absent.push(CONTEXT_FILES[i]);
    }
  });

  const ruleSource = [claude?.text, readme?.text].filter(Boolean).join('\n\n');
  const checklist = parseChecklist([plan?.text, readme?.text].filter(Boolean).join('\n\n'));

  return {
    ctxFiles,
    ctxRules: parseRules(ruleSource),
    ctxNever: parseNever(ruleSource),
    phases: parsePhases(plan?.text ?? ''),
    done: checklist.done,
    todo: checklist.todo,
    found,
    absent,
    unreadable,
  };
}
