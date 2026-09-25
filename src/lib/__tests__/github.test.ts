import { afterEach, describe, expect, it, vi } from 'vitest';
import { memoryStore } from '../cache';
import {
  createClient,
  fetchFirstTextFile,
  fetchRepoMeta,
  fetchTextFile,
  GitHubError,
  parseSlug,
} from '../github';

const REF = parseSlug('Aminebousmah/Atlas · main')!;

const META = {
  full_name: 'Aminebousmah/Atlas',
  description: null,
  default_branch: 'main',
  private: false,
  language: 'TypeScript',
  pushed_at: '2026-09-21T10:00:00Z',
  html_url: 'https://github.com/Aminebousmah/Atlas',
};

function reply(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(status === 304 || status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4999',
      'x-ratelimit-reset': '1790000000',
      ...headers,
    },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('fenêtre de fraîcheur', () => {
  it('ne rappelle pas GitHub pour une réponse récente', async () => {
    const fetchMock = vi.fn(async () => reply(200, META, { etag: 'W/"1"' }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createClient(null, memoryStore());

    await fetchRepoMeta(REF, client);
    await fetchRepoMeta(REF, client);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(client.origins).toEqual(['réseau', 'cache']);
  });

  it('sépare le cache authentifié de l’anonyme', async () => {
    const cache = memoryStore();
    const fetchMock = vi.fn(async () => reply(200, META, { etag: 'W/"1"' }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchRepoMeta(REF, createClient(null, cache));
    await fetchRepoMeta(REF, createClient('jeton', cache));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('relecture', () => {
  it('revalide une réponse récente auprès de GitHub', async () => {
    const cache = memoryStore();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, META, { etag: 'W/"abc"' }))
      .mockResolvedValueOnce(reply(304, null, { etag: 'W/"abc"' }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchRepoMeta(REF, createClient(null, cache));
    const again = createClient(null, cache, true);
    await fetchRepoMeta(REF, again);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers['If-None-Match']).toBe('W/"abc"');
    expect(again.origins).toEqual(['inchangé']);
  });

  it('rapporte tout de suite un dépôt qui a changé', async () => {
    const cache = memoryStore();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, META, { etag: 'W/"1"' }))
      .mockResolvedValueOnce(reply(200, { ...META, description: 'nouvelle' }, { etag: 'W/"2"' }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchRepoMeta(REF, createClient(null, cache));
    const meta = await fetchRepoMeta(REF, createClient(null, cache, true));

    expect(meta.description).toBe('nouvelle');
  });
});

describe('revalidation par ETag', () => {
  it('envoie If-None-Match et réutilise le corps sur 304', async () => {
    const cache = memoryStore();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, META, { etag: 'W/"abc"' }))
      .mockResolvedValueOnce(reply(304, null, { etag: 'W/"abc"' }));
    vi.stubGlobal('fetch', fetchMock);

    const first = createClient(null, cache);
    await fetchRepoMeta(REF, first);

    // On périme l'entrée pour forcer la revalidation.
    const key = 'anon:/repos/Aminebousmah/Atlas';
    const entry = cache.read(key)!;
    cache.write(key, { ...entry, storedAt: Date.now() - 10 * 60 * 1000 });

    const second = createClient(null, cache);
    const meta = await fetchRepoMeta(REF, second);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers['If-None-Match']).toBe('W/"abc"');
    expect(second.origins).toEqual(['inchangé']);
    expect(meta.fullName).toBe('Aminebousmah/Atlas');
  });

  it('remet le compteur de fraîcheur à zéro après un 304', async () => {
    const cache = memoryStore();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(reply(200, META, { etag: 'W/"abc"' }))
        .mockResolvedValueOnce(reply(304, null)),
    );

    const key = 'anon:/repos/Aminebousmah/Atlas';
    await fetchRepoMeta(REF, createClient(null, cache));
    cache.write(key, { ...cache.read(key)!, storedAt: 0 });

    await fetchRepoMeta(REF, createClient(null, cache));
    expect(Date.now() - cache.read(key)!.storedAt).toBeLessThan(1000);
  });
});

describe('quota', () => {
  it('retient ce que GitHub dit du quota', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply(200, META)));
    const client = createClient(null, memoryStore());

    await fetchRepoMeta(REF, client);

    expect(client.rate).toEqual({
      limit: 5000,
      remaining: 4999,
      resetAt: 1790000000 * 1000,
    });
  });

  it('sert une donnée périmée plutôt que d’échouer quand le quota est épuisé', async () => {
    const cache = memoryStore();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(reply(200, META, { etag: 'W/"abc"' }))
        .mockResolvedValueOnce(reply(403, { message: 'rate limited' }, { 'x-ratelimit-remaining': '0' })),
    );

    const key = 'anon:/repos/Aminebousmah/Atlas';
    await fetchRepoMeta(REF, createClient(null, cache));
    cache.write(key, { ...cache.read(key)!, storedAt: 0 });

    const client = createClient(null, cache);
    await expect(fetchRepoMeta(REF, client)).resolves.toMatchObject({
      fullName: 'Aminebousmah/Atlas',
    });
    expect(client.origins).toEqual(['cache']);
  });

  it('échoue clairement quand le quota est épuisé sans rien en cache', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply(403, {}, { 'x-ratelimit-remaining': '0' })));

    await expect(fetchRepoMeta(REF, createClient(null, memoryStore()))).rejects.toThrow(
      /Quota GitHub épuisé/,
    );
  });
});

describe('réseau', () => {
  it('sert le cache quand la requête échoue', async () => {
    const cache = memoryStore();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(reply(200, META, { etag: 'W/"abc"' }))
        .mockRejectedValueOnce(new TypeError('offline')),
    );

    const key = 'anon:/repos/Aminebousmah/Atlas';
    await fetchRepoMeta(REF, createClient(null, cache));
    cache.write(key, { ...cache.read(key)!, storedAt: 0 });

    const client = createClient(null, cache);
    await expect(fetchRepoMeta(REF, client)).resolves.toBeTruthy();
    expect(client.origins).toEqual(['cache']);
  });

  it('abandonne une requête qui ne répond pas, avec un message qui le dit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        // Le signal de délai maximal doit bien être transmis à fetch.
        expect(init.signal).toBeInstanceOf(AbortSignal);
        throw new DOMException('timeout', 'TimeoutError');
      }),
    );

    await expect(fetchRepoMeta(REF, createClient(null, memoryStore()))).rejects.toThrow(
      /n’a pas répondu en 15 s/,
    );
  });

  it('remonte l’échec réseau quand rien n’est en cache', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(fetchRepoMeta(REF, createClient(null, memoryStore()))).rejects.toThrow(
      /Impossible de joindre api.github.com/,
    );
  });

  it('fonctionne sans cache du tout', async () => {
    const fetchMock = vi.fn(async () => reply(200, META));
    vi.stubGlobal('fetch', fetchMock);
    const client = createClient(null, null);

    await fetchRepoMeta(REF, client);
    await fetchRepoMeta(REF, client);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(client.origins).toEqual(['réseau', 'réseau']);
  });
});

describe('fetchTextFile', () => {
  it('demande le fichier en brut et mesure sa taille', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('# Titre\nDeux lignes.', {
        status: 200,
        headers: { etag: 'W/"f"', 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '59', 'x-ratelimit-reset': '0' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const file = await fetchTextFile(REF, 'CLAUDE.md', createClient(null, memoryStore()));

    expect(fetchMock.mock.calls[0][1].headers.Accept).toBe('application/vnd.github.raw');
    expect(file?.text).toContain('Deux lignes.');
    expect(file?.bytes).toBe(20);
  });

  it('rend null sur un fichier absent, sans lever', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(
      fetchTextFile(REF, 'plan.md', createClient(null, memoryStore())),
    ).resolves.toBeNull();
  });

  it('remonte les autres erreurs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(
      fetchTextFile(REF, 'plan.md', createClient(null, memoryStore())),
    ).rejects.toThrow(GitHubError);
  });
});

describe('fetchFirstTextFile', () => {
  it('va chercher le plan dans docs/ quand il n’est pas à la racine', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('/contents/docs/plan.md')
        ? new Response('# Plan', { status: 200 })
        : new Response(null, { status: 404 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const file = await fetchFirstTextFile(
      REF,
      ['plan.md', 'docs/plan.md'],
      createClient(null, memoryStore()),
    );

    expect(file?.path).toBe('docs/plan.md');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('s’arrête au premier chemin trouvé', async () => {
    const fetchMock = vi.fn(async () => new Response('# Plan', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const file = await fetchFirstTextFile(REF, ['plan.md', 'docs/plan.md'], createClient(null, memoryStore()));

    expect(file?.path).toBe('plan.md');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rend null quand aucun chemin n’existe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
    await expect(
      fetchFirstTextFile(REF, ['plan.md', 'docs/plan.md'], createClient(null, memoryStore())),
    ).resolves.toBeNull();
  });
});
