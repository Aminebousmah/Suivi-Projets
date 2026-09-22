/**
 * Lecture des fichiers de session de Claude Code.
 *
 * Ces fichiers vivent dans `~/.claude/projects/`, hors dépôt, et un navigateur
 * ne lit pas le disque : ils sont déposés dans la page par l'utilisateur.
 *
 * Le format est du JSON Lines, une entrée par événement, et il n'est garanti
 * par rien. La lecture est donc tolérante : une ligne illisible est comptée et
 * ignorée, un champ absent n'empêche pas le reste, et ce qui n'est pas reconnu
 * n'est pas deviné.
 */

export interface Exchange {
  prompt: string;
  reply: string;
  at: string;
  /** Outils employés par Claude dans cette réponse. */
  tools: string[];
}

export interface ParsedSession {
  /** Identifiant de session s'il figure dans le fichier, sinon son nom. */
  id: string;
  file: string;
  started: string;
  ended: string;
  cwd: string | null;
  exchanges: Exchange[];
  /** Nombre d'emplois par outil, du plus au moins fréquent. */
  tools: [string, number][];
  /** Fichiers cités par les outils qui en manipulent. */
  files: string[];
  /** Lignes que la lecture n'a pas su interpréter. */
  skipped: number;
}

interface Block {
  type?: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/** Outils dont un chemin de fichier peut être tiré. */
const FILE_INPUTS = ['file_path', 'notebook_path', 'path'];

function blocksOf(content: unknown): Block[] {
  if (typeof content === 'string') return [{ type: 'text', text: content }];
  if (Array.isArray(content)) return content.filter((b): b is Block => !!b && typeof b === 'object');
  return [];
}

/** Ne garde que la parole : ni raisonnement, ni appels d'outils, ni résultats. */
export function textOf(content: unknown): string {
  return blocksOf(content)
    .filter((b) => b.type === 'text' || (b.type === undefined && typeof b.text === 'string'))
    .map((b) => (b.text ?? '').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

/**
 * Un message d'utilisateur qui ne contient que des résultats d'outils n'est pas
 * une demande : c'est la machine qui répond à la machine.
 */
export function isToolEcho(content: unknown): boolean {
  const blocks = blocksOf(content);
  return blocks.length > 0 && blocks.every((b) => b.type === 'tool_result');
}

function toolsOf(content: unknown): { names: string[]; files: string[] } {
  const names: string[] = [];
  const files: string[] = [];

  blocksOf(content).forEach((b) => {
    if (b.type !== 'tool_use' || !b.name) return;
    names.push(b.name);
    FILE_INPUTS.forEach((key) => {
      const value = b.input?.[key];
      if (typeof value === 'string' && value) files.push(value);
    });
  });

  return { names, files };
}

interface Line {
  type?: string;
  timestamp?: string;
  sessionId?: string;
  cwd?: string;
  message?: { role?: string; content?: unknown };
}

function roleOf(line: Line): string | null {
  const role = line.message?.role ?? line.type;
  return role === 'user' || role === 'assistant' ? role : null;
}

/**
 * Lit un fichier de session. Renvoie null quand rien d'exploitable n'y figure —
 * un fichier illisible n'est pas une panne, c'est un fichier qu'on n'affiche pas.
 */
export function parseSessionFile(file: string, content: string): ParsedSession | null {
  const exchanges: Exchange[] = [];
  const toolCount = new Map<string, number>();
  const files = new Set<string>();
  const stamps: string[] = [];

  let id = '';
  let cwd: string | null = null;
  let skipped = 0;
  let pending: { prompt: string; at: string } | null = null;

  for (const raw of content.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    let line: Line;
    try {
      line = JSON.parse(trimmed) as Line;
    } catch {
      skipped++;
      continue;
    }

    if (!id && typeof line.sessionId === 'string') id = line.sessionId;
    if (!cwd && typeof line.cwd === 'string') cwd = line.cwd;
    if (typeof line.timestamp === 'string') stamps.push(line.timestamp);

    const role = roleOf(line);
    if (!role) continue;
    const payload = line.message?.content;

    if (role === 'user') {
      if (isToolEcho(payload)) continue;
      const text = textOf(payload);
      if (!text) continue;
      // Deux demandes de suite : la précédente est restée sans réponse.
      if (pending) exchanges.push({ ...pending, reply: '', tools: [] });
      pending = { prompt: text, at: line.timestamp ?? '' };
      continue;
    }

    const { names, files: touched } = toolsOf(payload);
    names.forEach((n) => toolCount.set(n, (toolCount.get(n) ?? 0) + 1));
    touched.forEach((f) => files.add(f));

    const text = textOf(payload);
    if (!pending) continue;
    if (!text && names.length) continue; // réponse encore en cours d'outillage
    exchanges.push({ prompt: pending.prompt, reply: text, at: pending.at, tools: names });
    pending = null;
  }

  if (pending) exchanges.push({ ...pending, reply: '', tools: [] });
  if (!exchanges.length) return null;

  const sorted = stamps.filter(Boolean).sort();

  return {
    id: id || file,
    file,
    started: sorted[0] ?? '',
    ended: sorted[sorted.length - 1] ?? '',
    cwd,
    exchanges,
    tools: [...toolCount.entries()].sort((a, b) => b[1] - a[1]),
    files: [...files],
    skipped,
  };
}

/** Lit plusieurs fichiers, de la session la plus ancienne à la plus récente. */
export function parseSessionFiles(
  inputs: { name: string; text: string }[],
): { sessions: ParsedSession[]; unreadable: string[] } {
  const sessions: ParsedSession[] = [];
  const unreadable: string[] = [];

  inputs.forEach(({ name, text }) => {
    const parsed = parseSessionFile(name, text);
    if (parsed) sessions.push(parsed);
    else unreadable.push(name);
  });

  sessions.sort((a, b) => (a.started || '').localeCompare(b.started || ''));
  return { sessions, unreadable };
}

/** Date courte et lisible, ou le nom du fichier quand l'horodatage manque. */
export function shortDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/** Coupe un texte long sans couper un mot en deux. */
export function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd() + '…';
}
