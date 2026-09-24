// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../App';
import { REPOS } from '../../data/repos';

/**
 * Tests de rendu : ce qu'un lecteur voit vraiment à l'écran, vue par vue.
 * Ils remplacent les vérifications manuelles au navigateur.
 */

function open(search = '') {
  window.history.replaceState(null, '', '/' + search);
  return render(<App />);
}

/** Lit un paramètre de l'URL courante, sans se soucier de son encodage. */
function param(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

describe('les six vues rendent leur contenu', () => {
  it('fiche projet : ce que le projet fait et sa pile', () => {
    open();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Encyclopédie du');
    expect(screen.getByText('Ce que le projet fait')).toBeInTheDocument();
    expect(screen.getByText(REPOS.sole.does[0])).toBeInTheDocument();
    expect(screen.getByText('Feuille de suivi')).toBeInTheDocument();
  });

  it('fonctionnalités : l’arbre décrit, avec ses domaines', () => {
    open('?view=arch');
    expect(screen.getByRole('tree')).toBeInTheDocument();
    REPOS.sole.domains.slice(0, 3).forEach((d) => {
      expect(screen.getAllByText(d.name).length).toBeGreaterThan(0);
    });
  });

  it('sessions : la description figée et l’invite à déposer des fichiers', () => {
    open('?view=sessions');
    expect(screen.getByText(/description figée/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choisir des fichiers/i })).toBeInTheDocument();
  });

  it('contexte : règles actives et interdits', () => {
    open('?view=context');
    expect(screen.getByText('Règles actives')).toBeInTheDocument();
    expect(screen.getByText('À ne jamais faire')).toBeInTheDocument();
    expect(screen.getByText(REPOS.sole.ctxNever[0])).toBeInTheDocument();
  });

  it('avancement : les phases et leur statut', () => {
    open('?view=progress');
    expect(screen.getByText(REPOS.sole.phases[0].title)).toBeInTheDocument();
    expect(screen.getAllByText('fait').length).toBeGreaterThan(0);
  });

  it('dépôt réel : la vue n’interroge GitHub que sur demande', () => {
    open('?view=github');
    expect(screen.getByRole('button', { name: /interroger github/i })).toBeInTheDocument();
    expect(screen.queryByText(/poids du code/i)).not.toBeInTheDocument();
  });
});

describe('navigation', () => {
  it('change de vue et inscrit le choix dans l’URL', async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole('button', { name: /avancement/i }));

    expect(param('view')).toBe('progress');
    expect(screen.getByText(REPOS.sole.phases[0].title)).toBeInTheDocument();
  });

  it('change de dépôt, et la palette suit', async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole('button', { name: 'Eleven-Fields' }));

    expect(param('repo')).toBe('eleven');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
    expect(document.title).toBe('Atlas — Eleven-Fields');
  });

  it('ouvre directement une sélection depuis l’URL', () => {
    const d = REPOS.sole.domains[0];
    const f = d.features[0];
    open(`?view=arch&domain=${d.key}&feat=${encodeURIComponent(f.name)}`);

    const panel = screen.getByRole('complementary');
    expect(within(panel).getByText(f.name)).toBeInTheDocument();
    expect(within(panel).getByText(f.files[0])).toBeInTheDocument();
  });

  it('retombe sur la vue par défaut quand l’URL est fantaisiste', () => {
    open('?view=nulle&repo=néant');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Encyclopédie du');
  });
});

describe('arbre au clavier', () => {
  it('descend, parcourt et remonte à la flèche', async () => {
    const user = userEvent.setup();
    const d = REPOS.sole.domains[0];
    open(`?view=arch&domain=${d.key}`);

    const tree = screen.getByRole('tree');
    tree.focus();

    await user.keyboard('{ArrowRight}');
    expect(param('feat')).toBe(d.features[0].name);

    await user.keyboard('{ArrowDown}');
    expect(param('feat')).toBe(d.features[1].name);

    await user.keyboard('{Escape}');
    expect(param('feat')).toBeNull();
    expect(param('domain')).toBe(d.key);
  });

  it('donne le focus au nœud choisi au clavier', async () => {
    const user = userEvent.setup();
    const d = REPOS.sole.domains[0];
    open(`?view=arch&domain=${d.key}`);

    screen.getByRole('tree').focus();
    await user.keyboard('{ArrowRight}');

    const focused = document.activeElement as HTMLElement;
    expect(focused.dataset.noeud).toBe(`noeud:${d.key}/${d.features[0].name}`);
  });

  it('laisse la tabulation au navigateur', async () => {
    const user = userEvent.setup();
    open('?view=arch');
    const before = window.location.search;

    screen.getByRole('tree').focus();
    await user.keyboard('{Tab}');

    expect(window.location.search).toBe(before);
  });
});

describe('modes d’affichage', () => {
  it('bascule en liste et montre les cartes de domaine', async () => {
    const user = userEvent.setup();
    open('?view=arch');

    await user.click(screen.getByRole('button', { name: 'Liste' }));

    expect(param('viz')).toBe('list');
    const first = REPOS.sole.domains[0];
    expect(screen.getAllByText(first.role).length).toBeGreaterThan(0);
  });

  it('explique le mode dépôt tant que rien n’est connecté', async () => {
    const user = userEvent.setup();
    open('?view=arch');

    await user.click(screen.getByRole('button', { name: 'Dépôt' }));

    expect(param('src')).toBe('repo');
    expect(screen.getByText(/Aucun statut n'y figure/)).toBeInTheDocument();
  });
});

describe('un dépôt qui attend son atlas.md', () => {
  const awaiting = Object.keys(REPOS).filter((k) => !REPOS[k].domains.length);
  const views = ['sheet', 'arch', 'sessions', 'context', 'progress', 'github'];

  it.each(awaiting.flatMap((k) => views.map((v) => [k, v])))(
    '%s, vue %s : rend sans erreur',
    (key, view) => {
      open(`?repo=${key}&view=${view}`);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(REPOS[key].titleB);
      expect(screen.queryByText(/cette vue n’a pas pu s’afficher|n'a pas pu s'afficher/i)).not.toBeInTheDocument();
    },
  );
});
