import { useCallback, useEffect, useState } from 'react';
import type { RepoData } from '../data/types';
import type { CacheStore } from './cache';
import { ageMinutes, localStorageStore } from './cache';
import type { FileResult, LiveContext } from './context';
import { CONTEXT_FILES, buildLiveContext } from './context';
import type { CommitInfo, Origin, RateInfo, RepoMeta, RepoTree } from './github';
import {
  createClient,
  fetchCommits,
  fetchRepoMeta,
  fetchTextFile,
  fetchTree,
  parseSlug,
} from './github';
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
  /** Ce que GitHub dit du quota au dernier contact. */
  rate: RateInfo | null;
  /** Provenance de chacune des réponses de ce chargement. */
  origins: Origin[];
  /** Âge de la plus vieille réponse servie, en minutes. */
  age: number;
}

/** Le cache survit aux rendus : une seule instance pour toute l'application. */
const store: CacheStore = localStorageStore();

export function cacheStore(): CacheStore {
  return store;
}

/** Résume la provenance d'un chargement en une phrase affichable. */
export function describeOrigins(origins: Origin[], age: number): string {
  const n = (o: Origin) => origins.filter((x) => x === o).length;
  const parts: string[] = [];
  if (n('réseau')) parts.push(`${n('réseau')} téléchargée(s)`);
  if (n('inchangé')) parts.push(`${n('inchangé')} revalidée(s) sans coût de quota`);
  if (n('cache')) parts.push(`${n('cache')} servie(s) depuis le cache`);
  const suffix = age > 0 ? `, la plus ancienne confirmée il y a ${age} min` : '';
  return parts.length ? parts.join(', ') + suffix + '.' : 'Aucune réponse.';
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

    const client = createClient(token || null, store);
    Promise.all([
      fetchRepoMeta(ref, client),
      fetchTree(ref, client),
      fetchCommits(ref, client),
      // Les fichiers de contexte sont facultatifs : ni leur absence ni leur
      // échec de lecture ne doit empêcher d'afficher le dépôt.
      ...CONTEXT_FILES.map((path) =>
        fetchTextFile(ref, path, client).catch((): FileResult => ({ failed: true })),
      ),
    ])
      .then(([meta, tree, commits, ...files]) => {
        if (cancelled) return;
        const oldest = store
          .keys()
          .map((k) => store.read(k))
          .reduce((max, e) => (e ? Math.max(max, ageMinutes(e)) : max), 0);

        setState({
          status: 'ready',
          data: {
            meta,
            tree,
            commits,
            check: checkRepo(repo, tree.entries),
            context: buildLiveContext(files),
            rate: client.rate,
            origins: client.origins,
            age: oldest,
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
