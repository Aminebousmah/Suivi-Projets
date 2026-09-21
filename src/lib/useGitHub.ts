import { useCallback, useEffect, useState } from 'react';
import type { RepoData } from '../data/types';
import type { LiveContext } from './context';
import { CONTEXT_FILES, buildLiveContext } from './context';
import type { CommitInfo, RepoMeta, RepoTree } from './github';
import { fetchCommits, fetchRepoMeta, fetchTextFile, fetchTree, parseSlug } from './github';
import type { RepoCheck } from './verify';
import { checkRepo } from './verify';

const TOKEN_KEY = 'atlas.github.token';
const CONNECTED_KEY = 'atlas.github.connected';

/** Le jeton reste dans le navigateur : il n'est envoyé qu'à api.github.com. */
export function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* navigation privée ou stockage refusé : on continue sans mémoriser */
  }
}

/** La connexion au dépôt est reconduite d'une visite à l'autre, une fois demandée. */
export function readConnected(): boolean {
  try {
    return localStorage.getItem(CONNECTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeConnected(on: boolean): void {
  try {
    if (on) localStorage.setItem(CONNECTED_KEY, '1');
    else localStorage.removeItem(CONNECTED_KEY);
  } catch {
    /* stockage refusé : la connexion vaut pour cette visite seulement */
  }
}

export interface GitHubData {
  meta: RepoMeta;
  tree: RepoTree;
  commits: CommitInfo[];
  check: RepoCheck;
  context: LiveContext;
}

export type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: GitHubData };

export function useGitHub(repo: RepoData, token: string, enabled: boolean) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' });
      return;
    }

    const ref = parseSlug(repo.slug);
    if (!ref) {
      setState({
        status: 'error',
        message: `Impossible de lire « ${repo.slug} » comme un dépôt GitHub.`,
      });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    const auth = token || null;
    Promise.all([
      fetchRepoMeta(ref, auth),
      fetchTree(ref, auth),
      fetchCommits(ref, auth),
      // Un fichier de contexte absent n'est pas une panne : on note l'absence.
      ...CONTEXT_FILES.map((path) => fetchTextFile(ref, path, auth)),
    ])
      .then(([meta, tree, commits, ...files]) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          data: {
            meta,
            tree,
            commits,
            check: checkRepo(repo, tree.entries),
            context: buildLiveContext(files),
          },
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : 'Erreur inconnue.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [repo, token, enabled, nonce]);

  return { state, reload };
}
