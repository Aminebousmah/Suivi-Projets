import { MONO } from '../../components/ui';
import type { Domain, Theme } from '../../data/types';

interface Props {
  t: Theme;
  domains: Domain[];
  onOpenDomain: (key: string) => void;
}

/** Les mêmes branches qu'au graphe, en cartes, pour qui préfère lire une liste. */
export function DomainCards({ t, domains, onOpenDomain }: Props) {
  return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 10,
        }}
      >
        {domains.map((d) => {
          const tn = t.tones[d.tone];
          return (
            <button
              key={d.key}
              onClick={() => onOpenDomain(d.key)}
              style={{
                appearance: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                border: `1px solid ${tn.border}`,
                borderRadius: 12,
                background: tn.bg,
                color: tn.ink,
                padding: '16px 17px',
                display: 'flex',
                flexDirection: 'column',
                gap: 11,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25 }}>
                  {d.name}
                </span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: tn.inkSoft,
                  }}
                >
                  {d.num}
                </span>
              </span>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: tn.inkSoft }}>
                {d.role}
              </span>
              <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {d.features.slice(0, 4).map((f) => (
                  <span
                    key={f.name}
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      padding: '4px 8px',
                      borderRadius: 5,
                      background: tn.chipBg,
                    }}
                  >
                    {f.name}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
  );
}
