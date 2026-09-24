import { useCallback, useEffect, useState } from 'react';
import type { RepoData } from '../data/types';
import type { Coverage } from './coverage';
import { buildCoverage } from './coverage';
import type { CacheStore } from './cache';
import { ageMinutes, localStorageStore } from './cache';
import type { FileResult, LiveContext } from './context';
import { CONTEXT_PATHS, buildLiveContext } from './context';
import type { ActivitySummary } from './activity';
import { activityIndex, summarize, windowFrom } from './activity';
import type { CommitInfo, Origin, RateInfo, RepoMeta, RepoTree } from './github';
import {
  createClient,
  fetchCommits,
  fetchCompare,
  fetchRepoMeta,
  fetchFirstTextFile,
  fetchTree,
  parseSlug,
} from './github';
import type { Domain } from '../data/types';
import { buildDomainsFromTree } from './tree';
import { alignDomainKeys } from './atlasFile';
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
  /** Domaines déduits de l'arborescence réelle, sans statut inventé. */
  treeDomains: Domain[];
  /** Croisement entre ce que la description cite et ce que le dépôt contient. */
  coverage: Coverage;
  /** Ce qui a bougé entre le plus ancien et le plus récent commit chargé. */
  activity: ActivitySummary;
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
      ...CONTEXT_PATHS.map((paths) =>
        fetchFirstTextFile(ref, paths, client).catch((): FileResult => ({ failed: true })),
      ),
    ])
      .then(async ([meta, tree, commits, ...files]) => {
        if (cancelled) return;

        // atlas.md, quand le dépôt en fournit un, remplace la description
        // figée : c'est le dépôt qui dit alors ce qu'il fait.
        const context = buildLiveContext(files);
        if (context.atlas) {
          context.atlas = {
            ...context.atlas,
            domains: alignDomainKeys(context.atlas.domains, repo.domains),
          };
        }
        const described = context.atlas
          ? { ...repo, domains: context.atlas.domains }
          : repo;
        const coverage = buildCoverage(described, tree.entries);
        // L'activité s'obtient en une requête pour toute la plage de commits :
        // la demander fichier par fichier en coûterait une par fichier. Si la
        // comparaison échoue, l'arbre reste affichable, sans les constats.
        const range = windowFrom(commits);
        const changed = range
          ? await fetchCompare(ref, range.base, range.head, client).catch(() => [])
          : [];
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
            check: checkRepo(described, tree.entries),
            context,
            coverage,
            treeDomains: buildDomainsFromTree(tree.entries, {
              activity: activityIndex(changed),
              coverage,
            }),
            activity: summarize(changed, range),
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
