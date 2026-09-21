import { SourceBadge } from '../components/SourceBadge';
import { Kicker, MONO } from '../components/ui';
import type { RepoData, Theme } from '../data/types';
import type { LiveContext } from '../lib/context';

interface Props {
  t: Theme;
  repo: RepoData;
  live: LiveContext | null;
}

export function ProgressView({ t, repo, live }: Props) {
  const phases = live?.phases.length ? live.phases : repo.phases;
  const isLive = !!live?.phases.length;

  return (
    <section
      style={{
        padding: '24px clamp(18px, 3.5vw, 38px) 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <SourceBadge t={t} live={isLive} what="Les phases" from="plan.md" />

      {phases.map((p) => {
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

      {live && (live.done.length > 0 || live.todo.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 18 }}>
          <Kicker color={t.inkFaint}>
            Cases du plan — {live.done.length} cochée(s), {live.todo.length} restante(s)
          </Kicker>
          <div
            style={{
              border: `1px solid ${t.line}`,
              borderRadius: 12,
              overflow: 'hidden',
              background: t.surface,
            }}
          >
            {[
              ...live.done.map((text) => ({ text, done: true })),
              ...live.todo.map((text) => ({ text, done: false })),
            ].map((item) => (
              <div
                key={(item.done ? 'x' : 'o') + item.text}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '22px minmax(0, 1fr)',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: `1px solid ${t.line}`,
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: item.done ? t.statusFg.live : t.inkFaint,
                  }}
                >
                  {item.done ? '[x]' : '[ ]'}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: item.done ? t.inkSoft : t.ink,
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
