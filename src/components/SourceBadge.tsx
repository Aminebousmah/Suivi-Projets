import { MONO } from './ui';
import type { Theme } from '../data/types';

/** Ce qu'une vue sait de la lecture du dépôt, pour la proposer ou l'annoncer. */
export interface RepoReader {
  onConnect?: () => void;
  loading?: boolean;
  /** Pourquoi la dernière lecture a échoué, dit sur chaque vue et pas seulement la 06. */
  error?: string;
  /** Faux pour un dépôt ajouté : rien n'est écrit pour lui dans les données. */
  written?: boolean;
}

interface Props {
  t: Theme;
  live: boolean;
  /** Ce qui est affiché : « les phases », « les règles »… */
  what: string;
  /** Où c'est lu quand c'est live : « plan.md », « CLAUDE.md »… */
  from?: string;
  /** Ce qu'il faut savoir quand le dépôt a été lu sans fournir la source. */
  hint?: string;
  /** Lance la lecture du dépôt depuis le bandeau même, sans changer de vue. */
  onConnect?: () => void;
  /** Vrai pendant que le dépôt est lu. */
  loading?: boolean;
  error?: string;
  written?: boolean;
}

/**
 * Dit d'où vient ce qu'on lit à l'écran. Une vue alimentée par le dépôt et une
 * vue alimentée par la description figée ne se valent pas : le bandeau tranche,
 * et propose de lire le dépôt quand ce n'est pas encore fait.
 */
export function SourceBadge({
  t,
  live,
  what,
  from,
  hint,
  onConnect,
  loading,
  error,
  written = true,
}: Props) {
  // Un dépôt ajouté n'a rien d'écrit : on ne prétend pas le contraire.
  const fallback = written
    ? `${what} : écrit à la main dans src/data/repos.ts.`
    : `${what} : rien n'est écrit pour ce dépôt dans Atlas, tout vient de ${from ?? 'ses fichiers'}.`;
  let detail: string;
  let label = live ? 'lu dans le dépôt' : 'description figée';
  if (live) detail = `${what} : lu dans ${from} sur la branche décrite.`;
  else if (error) {
    label = 'lecture impossible';
    detail = error;
  } else if (loading) detail = `${what} : lecture du dépôt en cours…`;
  else if (onConnect)
    detail = `${fallback} Lisez le dépôt pour chercher ${from ?? 'ses fichiers de contexte'}.`;
  else detail = `${fallback}${hint ? ' ' + hint : ''}`;

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        padding: '8px 8px 8px 13px',
        borderRadius: 9,
        border: `1px ${live ? 'solid' : 'dashed'} ${live ? t.statusFg.live : t.line}`,
        background: live ? 'transparent' : t.surfaceAlt,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: live ? t.statusFg.live : t.inkFaint,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span style={{ flex: '1 1 260px', fontSize: 12, lineHeight: 1.5, color: t.inkSoft }}>
        {detail}
      </span>
      {!live && onConnect && !loading && (
        <button
          onClick={onConnect}
          style={{
            appearance: 'none',
            cursor: 'pointer',
            flex: 'none',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '7px 13px',
            borderRadius: 999,
            border: `1px solid ${t.accent}`,
            background: t.accent,
            color: t.onAccent,
          }}
        >
          {error ? 'Réessayer' : 'Lire le dépôt'}
        </button>
      )}
    </div>
  );
}
