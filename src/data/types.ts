export type Status = 'live' | 'wip' | 'frozen' | 'idea';
export type ToneKey = 'a' | 'b' | 'c' | 'd';

export interface Pill {
  bg: string;
  fg: string;
  border: string;
}

export interface Tone {
  bg: string;
  ink: string;
  inkSoft: string;
  border: string;
  dot: string;
  chipBg: string;
}

export interface Swatch {
  hex: string;
  title: string;
}

export interface Theme {
  page: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  line: string;
  primary: string;
  onPrimary: string;
  onPrimarySoft: string;
  hairline: string;
  accent: string;
  onAccent: string;
  display: string;
  displayWeight: string;
  emStyle: string;
  warnBg: string;
  warnBorder: string;
  warnFg: string;
  statusFg: Record<string, string>;
  pills: Record<string, Pill>;
  tones: Record<ToneKey, Tone>;
  swatches: Swatch[];
  source: string;
}

export interface Feature {
  name: string;
  status: Status;
  what: string;
  files: string[];
  notes?: string[];
}

export interface Domain {
  key: string;
  num: string;
  name: string;
  tone: ToneKey;
  role: string;
  detail: string;
  features: Feature[];
}

export interface Session {
  num: string;
  date: string;
  turns: string;
  tone: ToneKey;
  prompt: string;
  reply: string;
  outcome: Status;
  touched: string[];
}

export interface Memory {
  file: string;
  rule: string;
}

export interface CtxFile {
  name: string;
  size: string;
  tone: ToneKey;
  role: string;
  chips: string[];
}

export interface Phase {
  num: string;
  status: string;
  title: string;
  tone: Status;
  detail: string;
}

export interface StackRow {
  cat: string;
  v: string;
  note: string;
}

export interface TrackingRow {
  k: string;
  v: string;
  target: string;
  pct: string;
  tone: Status;
}

export interface Stat {
  v: string;
  k: string;
}

export interface RepoData {
  label: string;
  slug: string;
  titleA: string;
  titleB: string;
  tagline: string;
  stats: Stat[];
  does: string[];
  todo: string[];
  stack: StackRow[];
  tracking: TrackingRow[];
  domains: Domain[];
  goldenRule: string;
  hubName: string;
  hubCount: string;
  hubUnit: string;
  sessions: Session[];
  memories: Memory[];
  ctxFiles: CtxFile[];
  ctxRules: string[];
  ctxNever: string[];
  ctxOpen: string[];
  phases: Phase[];
}

export interface ViewDef {
  id: ViewId;
  num: string;
  label: string;
}

export type ViewId = 'sheet' | 'arch' | 'sessions' | 'context' | 'progress';
export type VizMode = 'graph' | 'list';
