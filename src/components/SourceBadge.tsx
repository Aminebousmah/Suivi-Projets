import { MONO } from './ui';
import type { Theme } from '../data/types';

interface Props {
  t: Theme;
  live: boolean;
  /** Ce qui est affiché : « les phases », « les règles »… */
  what: string;
  /** Où c'est lu quand c'est live : « plan.md », « CLAUDE.md »… */
  from?: string;
  /** Comment obtenir la version réelle, quand ce n'est pas la connexion GitHub. */
  hint?: string;
}

/**
 * Dit d'où vient ce qu'on lit à l'écran. Une vue alimentée par le dépôt et une
 * vue alimentée par la description figée ne se valent pas : le bandeau tranche.
 */
export function SourceBadge({ t, live, what, from, hint }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        flexWrap: 'wrap',
        padding: '9px 13px',
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
        }}
      >
        {live ? 'lu dans le dépôt' : 'description figée'}
      </span>
      <span style={{ fontSize: 12, lineHeight: 1.5, color: t.inkSoft }}>
        {live
          ? `${what} : lu dans ${from} sur la branche décrite.`
          : `${what} : écrit à la main dans src/data/repos.ts. ${
              hint ??
              `Connectez le dépôt depuis la vue « Dépôt réel » pour lire ${from ?? 'les fichiers de contexte'}.`
            }`}
      </span>
    </div>
  );
}
