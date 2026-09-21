import { useCallback, useEffect, useState } from 'react';
import type { RepoData } from '../data/types';
import type { CommitInfo, RepoMeta, RepoTree } from './github';
import { fetchCommits, fetchRepoMeta, fetchTree, parseSlug } from './github';
import type { RepoCheck } from './verify';
import { checkRepo } from './verify';

const TOKEN_KEY = 'atlas.github.token';

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

export interface GitHubData {
  meta: RepoMeta;
  tree: RepoTree;
  commits: CommitInfo[];
  check: RepoCheck;
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
    ])
      .then(([meta, tree, commits]) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          data: { meta, tree, commits, check: checkRepo(repo, tree.entries) },
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
