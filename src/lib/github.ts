/**
 * Client REST GitHub minimal, côté navigateur.
 *
 * Le jeton est facultatif : sans lui l'API publique plafonne à 60 requêtes par
 * heure et par adresse IP, et les dépôts privés restent inaccessibles.
 */

import type { CacheEntry, CacheStore } from './cache';
import { isFresh } from './cache';

const API = 'https://api.github.com';

/** Au-delà, on considère que GitHub ne répondra pas : mieux vaut le dire. */
export const TIMEOUT_MS = 15000;

export interface RepoRef {
  owner: string;
  repo: string;
  branch: string;
}

export interface RepoMeta {
  fullName: string;
  description: string | null;
  defaultBranch: string;
  private: boolean;
  language: string | null;
  pushedAt: string;
  htmlUrl: string;
}

export interface TreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size: number;
}

export interface RepoTree {
  entries: TreeEntry[];
  truncated: boolean;
  sha: string;
}

export interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

/** Ce que GitHub dit du quota, lu sur chaque réponse. */
export interface RateInfo {
  limit: number;
  remaining: number;
  /** Date de remise à zéro, en millisecondes. */
  resetAt: number;
}

/** D'où vient la donnée servie — ce que l'interface affiche à l'utilisateur. */
export type Origin = 'réseau' | 'cache' | 'inchangé';

/**
 * Porte le jeton, le cache et ce qu'on sait du quota. Le client est mutable à
 * dessein : chaque réponse met à jour `rate` et `origins`, que l'interface lit
 * après coup pour dire ce qui a réellement été demandé à GitHub.
 */
export interface Client {
  token: string | null;
  cache: CacheStore | null;
  rate: RateInfo | null;
  origins: Origin[];
}

export function createClient(token: string | null, cache: CacheStore | null): Client {
  return { token, cache, rate: null, origins: [] };
}

function readRate(headers: Headers): RateInfo | null {
  const limit = Number(headers.get('x-ratelimit-limit'));
  const remaining = Number(headers.get('x-ratelimit-remaining'));
  const reset = Number(headers.get('x-ratelimit-reset'));
  if (!Number.isFinite(limit) || !Number.isFinite(remaining)) return null;
  return { limit, remaining, resetAt: reset * 1000 };
}

export class GitHubError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
  }
}

/** Traduit les statuts HTTP de l'API en messages actionnables. */
function explain(status: number, ref: string, rateRemaining: string | null): string {
  if (status === 401) return 'Jeton refusé par GitHub — vérifiez qu’il est valide et non expiré.';
  if (status === 403 && rateRemaining === '0')
    return 'Quota GitHub épuisé. Ajoutez un jeton personnel ou attendez la prochaine heure.';
  if (status === 403) return `Accès refusé à ${ref} — le jeton manque de la portée « repo ».`;
  if (status === 404)
    return `${ref} est introuvable — dépôt privé sans jeton, ou nom de branche erroné.`;
  if (status >= 500) return 'GitHub est momentanément indisponible. Réessayez dans un instant.';
  return `Réponse inattendue de GitHub (HTTP ${status}) pour ${ref}.`;
}

/**
 * Requête GET passée par le cache.
 *
 * Trois issues : servie sans requête dans la fenêtre de fraîcheur ; revalidée
 * par ETag, et GitHub répond 304 sans décompter le quota ; ou bien téléchargée.
 */
async function request<T>(
  key: string,
  path: string,
  client: Client,
  label: string,
  parse: (res: Response) => Promise<T>,
): Promise<T> {
  const cacheKey = (client.token ? 'auth:' : 'anon:') + key;
  const cached = client.cache?.read<T>(cacheKey) ?? null;

  if (cached && isFresh(cached)) {
    client.origins.push('cache');
    return cached.data;
  }

  const headers: Record<string, string> = { Accept: acceptFor(path) };
  if (client.token) headers.Authorization = `Bearer ${client.token}`;
  if (cached?.etag) headers['If-None-Match'] = cached.etag;

  let res: Response;
  try {
    // Sans délai maximal, une requête qui reste pendante gèle la vue entière.
    res = await fetch(API + path, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    // Hors ligne ou trop lent : une donnée périmée vaut mieux qu'une page vide.
    if (cached) {
      client.origins.push('cache');
      return cached.data;
    }
    const timedOut = e instanceof DOMException && e.name === 'TimeoutError';
    throw new GitHubError(
      timedOut
        ? `GitHub n’a pas répondu en ${TIMEOUT_MS / 1000} s pour ${label} — réessayez.`
        : 'Impossible de joindre api.github.com — connexion réseau ?',
      0,
    );
  }

  const rate = readRate(res.headers);
  if (rate) client.rate = rate;

  if (res.status === 304 && cached) {
    client.origins.push('inchangé');
    client.cache?.write(cacheKey, { ...cached, storedAt: Date.now() });
    return cached.data;
  }

  if (!res.ok) {
    // Quota épuisé mais donnée déjà connue : on sert le cache plutôt que d'échouer.
    if (cached && (res.status === 403 || res.status >= 500)) {
      client.origins.push('cache');
      return cached.data;
    }
    throw new GitHubError(
      explain(res.status, label, res.headers.get('x-ratelimit-remaining')),
      res.status,
    );
  }

  const data = await parse(res);
  client.origins.push('réseau');
  const entry: CacheEntry<T> = { etag: res.headers.get('etag'), storedAt: Date.now(), data };
  client.cache?.write(cacheKey, entry);
  return data;
}

/** Les fichiers se demandent en brut, le reste en JSON. */
function acceptFor(path: string): string {
  return path.includes('/contents/')
    ? 'application/vnd.github.raw'
    : 'application/vnd.github+json';
}

async function getJson<T>(path: string, client: Client, label: string): Promise<T> {
  return request<T>(path, path, client, label, (res) => res.json() as Promise<T>);
}

/** Lit « Owner/Repo · branche · sha » tel qu'écrit dans les données de dépôt. */
export function parseSlug(slug: string): RepoRef | null {
  const [location, branch] = slug.split('·').map((s) => s.trim());
  if (!location) return null;
  const [owner, repo] = location.split('/');
  if (!owner || !repo) return null;
  return { owner, repo, branch: branch || 'main' };
}

export async function fetchRepoMeta(ref: RepoRef, client: Client): Promise<RepoMeta> {
  const raw = await getJson<{
    full_name: string;
    description: string | null;
    default_branch: string;
    private: boolean;
    language: string | null;
    pushed_at: string;
    html_url: string;
  }>(`/repos/${ref.owner}/${ref.repo}`, client, `${ref.owner}/${ref.repo}`);

  return {
    fullName: raw.full_name,
    description: raw.description,
    defaultBranch: raw.default_branch,
    private: raw.private,
    language: raw.language,
    pushedAt: raw.pushed_at,
    htmlUrl: raw.html_url,
  };
}

export async function fetchTree(ref: RepoRef, client: Client): Promise<RepoTree> {
  const raw = await getJson<{
    sha: string;
    truncated: boolean;
    tree: { path: string; type: string; size?: number }[];
  }>(
    `/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(ref.branch)}?recursive=1`,
    client,
    `l’arborescence de ${ref.owner}/${ref.repo}@${ref.branch}`,
  );

  return {
    sha: raw.sha,
    truncated: raw.truncated,
    entries: raw.tree
      .filter((e): e is { path: string; type: 'blob' | 'tree'; size?: number } =>
        e.type === 'blob' || e.type === 'tree',
      )
      .map((e) => ({ path: e.path, type: e.type, size: e.size ?? 0 })),
  };
}

export interface TextFile {
  path: string;
  text: string;
  bytes: number;
}

/**
 * Lit un fichier texte du dépôt. Renvoie null quand il n'existe pas : l'absence
 * d'un CLAUDE.md n'est pas une panne, c'est une information.
 */
export async function fetchTextFile(
  ref: RepoRef,
  path: string,
  client: Client,
): Promise<TextFile | null> {
  const url =
    `/repos/${ref.owner}/${ref.repo}/contents/${path}` +
    `?ref=${encodeURIComponent(ref.branch)}`;

  try {
    return await request<TextFile>(url, url, client, path, async (res) => {
      const text = await res.text();
      return { path, text, bytes: new TextEncoder().encode(text).length };
    });
  } catch (e) {
    // Un fichier de contexte absent n'est pas une panne : c'est une information.
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchCommits(
  ref: RepoRef,
  client: Client,
  perPage = 12,
): Promise<CommitInfo[]> {
  const raw = await getJson<
    {
      sha: string;
      html_url: string;
      commit: { message: string; author: { name: string; date: string } | null };
      author: { login: string } | null;
    }[]
  >(
    `/repos/${ref.owner}/${ref.repo}/commits?sha=${encodeURIComponent(ref.branch)}&per_page=${perPage}`,
    client,
    `l’historique de ${ref.owner}/${ref.repo}@${ref.branch}`,
  );

  return raw.map((c) => ({
    sha: c.sha,
    shortSha: c.sha.slice(0, 7),
    message: c.commit.message,
    author: c.author?.login ?? c.commit.author?.name ?? 'inconnu',
    date: c.commit.author?.date ?? '',
    url: c.html_url,
  }));
}
