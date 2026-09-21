import { MONO } from '../components/ui';
import type { RepoData, Theme } from '../data/types';

interface Props {
  t: Theme;
  repo: RepoData;
}

export function ProgressView({ t, repo }: Props) {
  return (
    <section
      style={{
        padding: '24px clamp(18px, 3.5vw, 38px) 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {repo.phases.map((p) => {
        const pl = t.pills[p.tone] || t.pills.idea;
        return (
          <div
            key={p.num + p.title}
            style={{
              border: `1px solid ${t.line}`,
              borderLeft: `4px solid ${pl.border}`,
              borderRadius: 12,
              background: t.surface,
              padding: '17px 20px',
              display: 'grid',
              gridTemplateColumns: '116px minmax(0, 1fr)',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: pl.bg,
                  color: pl.fg,
                  border: `1px solid ${pl.border}`,
                  textAlign: 'center',
                }}
              >
                {p.status}
              </span>
              <span
                style={{ fontFamily: MONO, fontSize: 11, color: t.inkFaint, textAlign: 'center' }}
              >
                {p.num}
              </span>
            </span>
            <span
              style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{p.title}</span>
              <span style={{ fontSize: 13, lineHeight: 1.55, color: t.inkSoft }}>{p.detail}</span>
            </span>
          </div>
        );
      })}
    </section>
  );
}
