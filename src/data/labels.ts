import type { Status, ViewDef, ViewId } from './types';

export const LABELS: Record<Status, string> = {
  live: 'en ligne',
  wip: 'en cours',
  frozen: 'gelée',
  idea: 'idée',
};

export const STATE_LABEL: Record<string, string> = {
  live: 'terminée',
  wip: 'en développement',
  frozen: 'gelée',
  idea: 'à explorer',
  partial: 'partielle',
};

export const ORDER: Status[] = ['live', 'wip', 'frozen', 'idea'];

export const VIEWS: ViewDef[] = [
  { id: 'sheet', num: '01', label: 'Fiche projet' },
  { id: 'arch', num: '02', label: 'Fonctionnalités' },
  { id: 'sessions', num: '03', label: 'Sessions' },
  { id: 'context', num: '04', label: 'Contexte Claude' },
  { id: 'progress', num: '05', label: 'Avancement' },
  { id: 'github', num: '06', label: 'Dépôt réel' },
];

export const BLURBS: Record<ViewId, string> = {
  sheet:
    "Ce que le projet fait, ce qu'il doit encore faire, sa pile technique poste par poste, et sa feuille de suivi.",
  arch: "L'arbre entier : chaque domaine et chacune de ses fonctionnalités. La pastille donne l'état ; un clic ouvre les fichiers dans le panneau.",
  sessions: 'Vos demandes et le condensé de ce que Claude a répondu, session par session.',
  context:
    "Ce que Claude Code lit avant d'agir : fichiers de contexte, règles actives, interdits, décisions en suspens.",
  progress: "Les phases telles qu'elles sont écrites dans plan.md, avec leur statut réel.",
  github:
    "Le dépôt tel qu'il est vraiment : métadonnées GitHub, derniers commits, et confrontation des fichiers cités ici à l'arborescence réelle.",
};
