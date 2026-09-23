// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

/**
 * La vue « Dépôt réel » de bout en bout, avec un GitHub simulé : c'est le seul
 * chemin de l'application qui parle au réseau, et le dernier qui n'était
 * vérifié qu'à la main.
 */

const TREE = [
  'src/lib/graph.ts',
  'src/lib/tree.ts',
  'src/views/ArchView.tsx',
  'CLAUDE.md',
  'plan.md',
  'un/fichier/que/personne/ne/cite.ts',
];

const CLAUDE_MD = `# Projet

Une phrase de présentation.

## Conventions de code

- Une règle bien à elle.

## À ne jamais faire

- Un interdit bien à lui.
`;

const PLAN_MD = `# Plan

## Phase 1 — Le socle ✅

Ce que la phase a produit.

## Phase 2 — La suite 🚧

- [x] Une case cochée
- [ ] Une case restante
`;

/** Répond à la place de GitHub, selon le chemin demandé. */
function fakeGitHub(overrides: Record<string, () => Response> = {}) {
  return vi.fn(async (url: string) => {
    const path = url.replace('https://api.github.com', '');
    const custom = Object.keys(overrides).find((k) => path.includes(k));
    if (custom) return overrides[custom]();

    const json = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4987',
          'x-ratelimit-reset': '1790000000',
          etag: 'W/"x"',
        },
      });

    if (path.includes('/git/trees/')) {
      return json({
        sha: 'abc',
        truncated: false,
        tree: TREE.map((p) => ({ path: p, type: 'blob', size: 2000 })),
      });
    }
    if (path.includes('/commits')) {
      return json([
        {
          sha: 'aaaaaaa1111',
          html_url: 'https://github.com/x/y/commit/aaaaaaa',
          commit: { message: 'Un commit récent', author: { name: 'moi', date: '2026-09-22T10:00:00Z' } },
          author: { login: 'aminebousmah' },
        },
        {
          sha: 'bbbbbbb2222',
          html_url: 'https://github.com/x/y/commit/bbbbbbb',
          commit: { message: 'Un commit plus ancien', author: { name: 'moi', date: '2026-09-20T10:00:00Z' } },
          author: null,
        },
      ]);
    }
    if (path.includes('/compare/')) {
      return json({ files: [{ filename: 'src/lib/tree.ts', status: 'modified', changes: 42 }] });
    }
    if (path.includes('/contents/CLAUDE.md')) return new Response(CLAUDE_MD, { status: 200 });
    if (path.includes('/contents/plan.md')) return new Response(PLAN_MD, { status: 200 });
    if (path.includes('/contents/README.md')) return new Response(null, { status: 404 });

    return json({
      full_name: 'Aminebousmah/Suivi-Projets',
      description: null,
      default_branch: 'main',
      private: false,
      language: 'TypeScript',
      pushed_at: '2026-09-22T10:00:00Z',
      html_url: 'https://github.com/Aminebousmah/Suivi-Projets',
    });
  });
}

function open(search: string) {
  window.history.replaceState(null, '', '/' + search);
  return render(<App />);
}

async function connect() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /interroger github/i }));
  await screen.findByText(/poids du code/i, {}, { timeout: 3000 });
  return user;
}

afterEach(() => vi.unstubAllGlobals());

describe('vue Dépôt réel', () => {
  it('montre ce que GitHub répond', async () => {
    vi.stubGlobal('fetch', fakeGitHub());
    open('?repo=atlas&view=github');
    await connect();

    expect(screen.getByText('Aminebousmah/Suivi-Projets')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Un commit récent')).toBeInTheDocument();
    expect(screen.getByText(/4987 \/ 5000/)).toBeInTheDocument();
  });

  it('dit quels fichiers de contexte il a lus, et lesquels manquent', async () => {
    vi.stubGlobal('fetch', fakeGitHub());
    open('?repo=atlas&view=github');
    await connect();

    expect(screen.getByText('Une phrase de présentation.')).toBeInTheDocument();
    expect(screen.getByText(/absent du dépôt/i)).toBeInTheDocument();
  });

  it('croise les deux arbres et compte ce que personne ne décrit', async () => {
    vi.stubGlobal('fetch', fakeGitHub());
    open('?repo=atlas&view=github');
    await connect();

    const bloc = screen.getByText('Croisement des deux arbres').parentElement!;
    // Cinq des six chemins simulés sont cités par la description d'Atlas ;
    // seul « un/fichier/que/personne/ne/cite.ts » ne l'est pas.
    expect(bloc.textContent).toContain('5/6');
    expect(bloc.textContent).toMatch(/fichiers du dépôt rattachés/);
  });

  it('traduit un refus de GitHub en consigne, pas en trace technique', async () => {
    vi.stubGlobal(
      'fetch',
      fakeGitHub({
        '/repos/': () =>
          new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }),
      }),
    );
    open('?repo=atlas&view=github');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /interroger github/i }));

    expect(await screen.findByText(/Quota GitHub épuisé/, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});

describe('ce que le dépôt change dans les autres vues', () => {
  it('fait basculer Contexte Claude sur les fichiers lus', async () => {
    vi.stubGlobal('fetch', fakeGitHub());
    open('?repo=atlas&view=github');
    const user = await connect();

    await user.click(screen.getByRole('button', { name: /contexte claude/i }));

    expect(screen.getByText(/lu dans le dépôt/i)).toBeInTheDocument();
    expect(screen.getByText('Une règle bien à elle.')).toBeInTheDocument();
    expect(screen.getByText('Un interdit bien à lui.')).toBeInTheDocument();
  });

  it('fait basculer Avancement sur les phases de plan.md', async () => {
    vi.stubGlobal('fetch', fakeGitHub());
    open('?repo=atlas&view=github');
    const user = await connect();

    await user.click(screen.getByRole('button', { name: /avancement/i }));

    expect(screen.getByText('Le socle')).toBeInTheDocument();
    expect(screen.getByText('Une case restante')).toBeInTheDocument();
  });

  it('remplit l’arbre du dépôt, activité comprise', async () => {
    vi.stubGlobal('fetch', fakeGitHub());
    open('?repo=atlas&view=github');
    const user = await connect();

    await user.click(screen.getByRole('button', { name: /fonctionnalités/i }));
    await user.click(screen.getByRole('button', { name: 'Dépôt' }));

    expect(screen.getAllByText('modifié, 42 ligne(s)').length).toBeGreaterThan(0);
  });
});

describe('lire le dépôt sans quitter la vue', () => {
  it('le bouton du bandeau lit le dépôt et bascule la vue sur ce qu’il porte', async () => {
    vi.stubGlobal('fetch', fakeGitHub());
    open('?repo=atlas&view=context');
    const user = userEvent.setup();

    expect(screen.getByText(/description figée/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /lire le dépôt/i }));

    expect(await screen.findByText(/lu dans le dépôt/i, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('Une règle bien à elle.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /lire le dépôt/i })).not.toBeInTheDocument();
  });

  it('propose de réessayer après un échec', async () => {
    vi.stubGlobal(
      'fetch',
      fakeGitHub({ '/repos/': () => new Response('{}', { status: 500 }) }),
    );
    open('?repo=atlas&view=progress');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /lire le dépôt/i }));

    expect(
      await screen.findByRole('button', { name: /lire le dépôt/i }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});
