import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import type { Theme } from '../data/types';
import { Kicker, MONO } from './ui';

interface Props {
  t: Theme;
  /** Revenir à une vue sûre. */
  onRecover: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Une vue qui plante ne doit pas emporter l'application : l'en-tête, les
 * onglets et les autres vues restent utilisables. React n'offre ce filet que par
 * une classe — c'est la seule de l'application.
 *
 * App la remonte à chaque changement de vue ou de dépôt, par sa clé : changer
 * d'onglet suffit donc à sortir de l'erreur.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Pas de service de suivi : la console du navigateur garde la trace.
    console.error('Atlas — une vue a échoué :', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { t, onRecover } = this.props;
    return (
      <section style={{ padding: '32px clamp(18px, 3.5vw, 38px) 48px' }}>
        <div
          role="alert"
          style={{
            border: `1px solid ${t.warnBorder}`,
            borderRadius: 12,
            background: t.warnBg,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 720,
          }}
        >
          <Kicker color={t.warnFg}>Cette vue n'a pas pu s'afficher</Kicker>
          <span style={{ fontSize: 13.5, lineHeight: 1.6, color: t.ink }}>
            Les autres vues restent disponibles dans les onglets ci-dessus. Si l'erreur vient
            de données lues dans le dépôt, un fichier mal formé en est souvent la cause.
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11.5,
              color: t.inkSoft,
              wordBreak: 'break-word',
            }}
          >
            {error.message || String(error)}
          </span>
          <button
            onClick={onRecover}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '9px 16px',
              borderRadius: 999,
              border: `1px solid ${t.accent}`,
              background: t.accent,
              color: t.onAccent,
            }}
          >
            Revenir à la fiche projet
          </button>
        </div>
      </section>
    );
  }
}
