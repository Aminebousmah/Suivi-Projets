import { HoverButton, MONO } from '../../components/ui';
import type { Domain, Theme } from '../../data/types';

interface Props {
  t: Theme;
  domain: Domain;
  featName: string | null;
  narrow: boolean;
  badge: (f: { status?: string; meta?: string }) => string;
  pill: (status: string | undefined) => { bg: string; fg: string; border: string };
  onOpenFeat: (name: string) => void;
}

/** Le contenu d'une branche, ligne à ligne, avec son statut ou son poids. */
export function FeatureTable({ t, domain, featName, narrow, badge, pill, onOpenFeat }: Props) {
  return (
      <div
        style={{
          border: `1px solid ${t.line}`,
          borderRadius: 12,
          overflow: 'hidden',
          background: t.surface,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: narrow ? 'minmax(0, 1fr) 92px' : '250px minmax(0, 1fr) 100px',
            gap: narrow ? 10 : 16,
            padding: '10px 16px',
            borderBottom: `1px solid ${t.line}`,
            fontFamily: MONO,
            fontSize: 9.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: t.inkFaint,
          }}
        >
          <span>{domain.features.some((f) => f.status) ? 'Fonctionnalité' : 'Élément'}</span>
          {!narrow && (
            <span>{domain.features.some((f) => f.status) ? "Ce qu'elle fait" : 'Chemin'}</span>
          )}
          <span style={{ textAlign: 'right' }}>
            {domain.features.some((f) => f.status) ? 'Statut' : 'Poids'}
          </span>
        </div>
        {domain.features.map((f) => {
          const on = featName === f.name;
          const p = pill(f.status);
          return (
            <HoverButton
              key={f.name}
              onClick={() => onOpenFeat(f.name)}
              hoverBackground={t.surfaceAlt}
              style={{
                appearance: 'none',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
                textAlign: 'left',
                background: on ? t.surfaceAlt : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${t.line}`,
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: narrow
                  ? 'minmax(0, 1fr) 92px'
                  : '250px minmax(0, 1fr) 100px',
                gap: narrow ? 10 : 16,
                alignItems: 'baseline',
                color: t.ink,
              }}
            >
              <span
                style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: on ? t.tones[domain.tone].dot : t.inkFaint,
                  }}
                >
                  {on ? '▸' : '·'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                  {f.name}
                </span>
              </span>
              {!narrow && (
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: t.inkSoft }}>
                  {f.what}
                </span>
              )}
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '4px 7px',
                  borderRadius: 999,
                  background: f.status ? p.bg : 'transparent',
                  color: f.status ? p.fg : t.inkSoft,
                  border: `1px solid ${f.status ? p.border : t.line}`,
                  textAlign: 'center',
                }}
              >
                {badge(f)}
              </span>
            </HoverButton>
          );
        })}
      </div>
  );
}
