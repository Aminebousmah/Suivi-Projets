/**
 * Client REST GitHub minimal, côté navigateur.
 *
 * Le jeton est facultatif : sans lui l'API publique plafonne à 60 requêtes par
 * heure et par adresse IP, et les dépôts privés restent inaccessibles.
 */

const API = 'https://api.github.com';

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

async function get<T>(path: string, token: string | null, ref: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(API + path, { headers });
  } catch {
    throw new GitHubError('Impossible de joindre api.github.com — connexion réseau ?', 0);
  }

  if (!res.ok) {
    throw new GitHubError(
      explain(res.status, ref, res.headers.get('x-ratelimit-remaining')),
      res.status,
    );
  }
  return (await res.json()) as T;
}

/** Lit « Owner/Repo · branche · sha » tel qu'écrit dans les données de dépôt. */
export function parseSlug(slug: string): RepoRef | null {
  const [location, branch] = slug.split('·').map((s) => s.trim());
  if (!location) return null;
  const [owner, repo] = location.split('/');
  if (!owner || !repo) return null;
  return { owner, repo, branch: branch || 'main' };
}

export async function fetchRepoMeta(ref: RepoRef, token: string | null): Promise<RepoMeta> {
  const raw = await get<{
    full_name: string;
    description: string | null;
    default_branch: string;
    private: boolean;
    language: string | null;
    pushed_at: string;
    html_url: string;
  }>(`/repos/${ref.owner}/${ref.repo}`, token, `${ref.owner}/${ref.repo}`);

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

export async function fetchTree(ref: RepoRef, token: string | null): Promise<RepoTree> {
  const raw = await get<{
    sha: string;
    truncated: boolean;
    tree: { path: string; type: string; size?: number }[];
  }>(
    `/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(ref.branch)}?recursive=1`,
    token,
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
  token: string | null,
): Promise<TextFile | null> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.raw' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url =
    `${API}/repos/${ref.owner}/${ref.repo}/contents/${path}` +
    `?ref=${encodeURIComponent(ref.branch)}`;

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    throw new GitHubError('Impossible de joindre api.github.com — connexion réseau ?', 0);
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new GitHubError(
      explain(res.status, path, res.headers.get('x-ratelimit-remaining')),
      res.status,
    );
  }

  const text = await res.text();
  return { path, text, bytes: new TextEncoder().encode(text).length };
}

export async function fetchCommits(
  ref: RepoRef,
  token: string | null,
  perPage = 12,
): Promise<CommitInfo[]> {
  const raw = await get<
    {
      sha: string;
      html_url: string;
      commit: { message: string; author: { name: string; date: string } | null };
      author: { login: string } | null;
    }[]
  >(
    `/repos/${ref.owner}/${ref.repo}/commits?sha=${encodeURIComponent(ref.branch)}&per_page=${perPage}`,
    token,
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
