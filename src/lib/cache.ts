/**
 * Cache des réponses GitHub.
 *
 * Deux niveaux, parce que le quota est la ressource rare :
 *  — une fenêtre de fraîcheur pendant laquelle aucune requête n'est émise ;
 *  — au-delà, une requête conditionnelle avec l'ETag. GitHub répond alors 304
 *    et, contrairement à une réponse pleine, ce 304 ne décompte pas du quota.
 */

export interface CacheEntry<T = unknown> {
  /** ETag renvoyé par GitHub, seul moyen de revalider sans payer une requête. */
  etag: string | null;
  /** Date du dernier contact avec GitHub, 304 compris. */
  storedAt: number;
  data: T;
}

export interface CacheStore {
  read<T>(key: string): CacheEntry<T> | null;
  write<T>(key: string, entry: CacheEntry<T>): void;
  remove(key: string): void;
  /** Vide le cache et renvoie le nombre d'entrées supprimées. */
  clear(): number;
  keys(): string[];
}

export const PREFIX = 'atlas.cache.v1:';

/** Durée pendant laquelle une entrée est servie sans même revalider. */
export const FRESH_MS = 5 * 60 * 1000;

export function isFresh(entry: CacheEntry, now = Date.now()): boolean {
  return now - entry.storedAt < FRESH_MS;
}

/** Depuis combien de temps cette entrée a-t-elle été confirmée, en minutes. */
export function ageMinutes(entry: CacheEntry, now = Date.now()): number {
  return Math.max(0, Math.floor((now - entry.storedAt) / 60000));
}

/** Cache en mémoire : celui des tests, et le repli quand le stockage est refusé. */
export function memoryStore(): CacheStore {
  const map = new Map<string, string>();
  return {
    read<T>(key: string) {
      const raw = map.get(PREFIX + key);
      return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
    },
    write(key, entry) {
      map.set(PREFIX + key, JSON.stringify(entry));
    },
    remove(key) {
      map.delete(PREFIX + key);
    },
    clear() {
      const n = map.size;
      map.clear();
      return n;
    },
    keys() {
      return [...map.keys()].map((k) => k.slice(PREFIX.length));
    },
  };
}

/**
 * Cache adossé au localStorage. Tout accès peut échouer — navigation privée,
 * stockage refusé, quota dépassé — et aucun de ces échecs ne doit empêcher
 * l'application de fonctionner : le cache est une optimisation, pas une source.
 */
export function localStorageStore(): CacheStore {
  const store: CacheStore = {
    read<T>(key: string) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        return typeof parsed?.storedAt === 'number' ? parsed : null;
      } catch {
        return null;
      }
    },

    write(key, entry) {
      const payload = JSON.stringify(entry);
      try {
        localStorage.setItem(PREFIX + key, payload);
      } catch {
        // Plein : on sacrifie les entrées les plus anciennes, puis on réessaie
        // une fois. Si ça résiste, on renonce au cache sans faire d'histoires.
        evictOldest(store, 5);
        try {
          localStorage.setItem(PREFIX + key, payload);
        } catch {
          /* tant pis : la donnée reste servie depuis le réseau */
        }
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch {
        /* rien à faire */
      }
    },

    clear() {
      const keys = store.keys();
      keys.forEach((k) => store.remove(k));
      return keys.length;
    },

    keys() {
      try {
        const out: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
        }
        return out;
      } catch {
        return [];
      }
    },
  };

  return store;
}

/** Supprime les n entrées confirmées le plus anciennement. */
export function evictOldest(store: CacheStore, n: number): number {
  const dated = store
    .keys()
    .map((key) => ({ key, at: store.read(key)?.storedAt ?? 0 }))
    .sort((a, b) => a.at - b.at)
    .slice(0, n);

  dated.forEach(({ key }) => store.remove(key));
  return dated.length;
}
