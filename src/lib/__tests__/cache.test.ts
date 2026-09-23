import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CacheEntry } from '../cache';
import {
  ageMinutes,
  evictOldest,
  FRESH_MS,
  isFresh,
  localStorageStore,
  memoryStore,
  PREFIX,
} from '../cache';

const entry = <T>(data: T, storedAt = Date.now(), etag: string | null = 'W/"abc"'): CacheEntry<T> => ({
  data,
  storedAt,
  etag,
});

describe('memoryStore', () => {
  it('relit ce qu’il a écrit', () => {
    const s = memoryStore();
    s.write('a', entry({ n: 1 }));
    expect(s.read<{ n: number }>('a')?.data).toEqual({ n: 1 });
  });

  it('rend null sur une clé inconnue', () => {
    expect(memoryStore().read('néant')).toBeNull();
  });

  it('liste ses clés sans le préfixe et se vide', () => {
    const s = memoryStore();
    s.write('a', entry(1));
    s.write('b', entry(2));
    expect(s.keys().sort()).toEqual(['a', 'b']);
    expect(s.clear()).toBe(2);
    expect(s.keys()).toEqual([]);
  });
});

describe('fraîcheur', () => {
  it('est fraîche dans la fenêtre, périmée après', () => {
    const now = 1_000_000;
    expect(isFresh(entry(1, now - 1000), now)).toBe(true);
    expect(isFresh(entry(1, now - FRESH_MS - 1), now)).toBe(false);
  });

  it('compte l’âge en minutes entières', () => {
    const now = 1_000_000;
    expect(ageMinutes(entry(1, now - 90_000), now)).toBe(1);
    expect(ageMinutes(entry(1, now + 5000), now)).toBe(0);
  });
});

describe('evictOldest', () => {
  it('supprime les entrées les plus anciennes d’abord', () => {
    const s = memoryStore();
    s.write('vieux', entry(1, 100));
    s.write('moyen', entry(2, 200));
    s.write('récent', entry(3, 300));

    expect(evictOldest(s, 2)).toBe(2);
    expect(s.keys()).toEqual(['récent']);
  });

  it('ne se plaint pas quand il y a moins d’entrées que demandé', () => {
    const s = memoryStore();
    s.write('seul', entry(1));
    expect(evictOldest(s, 10)).toBe(1);
  });
});

/** localStorage minimal, avec une limite de taille pour éprouver la purge. */
function fakeStorage(maxChars = Infinity) {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    setItem(k: string, v: string) {
      const total = [...map.entries()]
        .filter(([key]) => key !== k)
        .reduce((a, [key, val]) => a + key.length + val.length, 0);
      if (total + k.length + v.length > maxChars) {
        throw new DOMException('quota', 'QuotaExceededError');
      }
      map.set(k, v);
    },
    map,
  };
}

describe('localStorageStore', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('écrit et relit sous son préfixe', () => {
    const fake = fakeStorage();
    vi.stubGlobal('localStorage', fake);
    const s = localStorageStore();

    s.write('repos/x', entry('bonjour'));
    expect(fake.map.has(PREFIX + 'repos/x')).toBe(true);
    expect(s.read<string>('repos/x')?.data).toBe('bonjour');
  });

  it('ignore une entrée corrompue au lieu de lever', () => {
    const fake = fakeStorage();
    fake.map.set(PREFIX + 'abîmé', '{ pas du json');
    vi.stubGlobal('localStorage', fake);

    expect(localStorageStore().read('abîmé')).toBeNull();
  });

  it('ignore une entrée qui n’a pas la forme attendue', () => {
    const fake = fakeStorage();
    fake.map.set(PREFIX + 'vieux', JSON.stringify({ autre: 'forme' }));
    vi.stubGlobal('localStorage', fake);

    expect(localStorageStore().read('vieux')).toBeNull();
  });

  it('fait de la place quand le stockage est plein', () => {
    const fake = fakeStorage(400);
    vi.stubGlobal('localStorage', fake);
    const s = localStorageStore();

    s.write('a', entry('x'.repeat(80), 100));
    s.write('b', entry('y'.repeat(80), 200));
    const before = s.keys().length;

    s.write('c', entry('z'.repeat(80), 300));

    expect(before).toBe(2);
    expect(s.read<string>('c')?.data).toMatch(/^z+$/);
    expect(s.keys()).not.toContain('a');
  });

  it('ne casse pas quand le stockage est refusé', () => {
    vi.stubGlobal('localStorage', {
      get length(): number {
        throw new Error('refusé');
      },
      key: () => {
        throw new Error('refusé');
      },
      getItem: () => {
        throw new Error('refusé');
      },
      setItem: () => {
        throw new Error('refusé');
      },
      removeItem: () => {
        throw new Error('refusé');
      },
    });

    const s = localStorageStore();
    expect(() => s.write('a', entry(1))).not.toThrow();
    expect(s.read('a')).toBeNull();
    expect(s.keys()).toEqual([]);
    expect(s.clear()).toBe(0);
  });

  it('ne compte que ses propres clés', () => {
    const fake = fakeStorage();
    fake.map.set('autre.appli', 'valeur');
    vi.stubGlobal('localStorage', fake);
    const s = localStorageStore();

    s.write('à-moi', entry(1));
    expect(s.keys()).toEqual(['à-moi']);
    expect(s.clear()).toBe(1);
    expect(fake.map.has('autre.appli')).toBe(true);
  });
});
