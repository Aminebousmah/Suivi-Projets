// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { THEMES } from '../../data/themes';
import { ErrorBoundary } from '../ErrorBoundary';

function Casse(): never {
  throw new Error('fichier mal formé');
}

describe('ErrorBoundary', () => {
  it('laisse passer une vue qui fonctionne', () => {
    render(
      <ErrorBoundary t={THEMES.atlas} onRecover={() => {}}>
        <p>tout va bien</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('tout va bien')).toBeInTheDocument();
  });

  it('remplace une vue qui plante par un message et une issue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onRecover = vi.fn();
    render(
      <ErrorBoundary t={THEMES.atlas} onRecover={onRecover}>
        <Casse />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent("Cette vue n'a pas pu s'afficher");
    expect(screen.getByText('fichier mal formé')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /revenir à la fiche/i }));
    expect(onRecover).toHaveBeenCalledOnce();
  });
});
