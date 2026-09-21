import { Kicker, MONO } from '../components/ui';
import type { RepoData, Theme } from '../data/types';

interface Props {
  t: Theme;
  repo: RepoData;
  repoKey: string;
}

export function SessionsView({ t, repo, repoKey }: Props) {
  return (
    <section
      style={{
        padding: '24px clamp(18px, 3.5vw, 38px) 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div
        style={{
          border: `1px dashed ${t.accent}`,
          borderRadius: 10,
          padding: '12px 15px',
          display: 'flex',
          gap: 12,
          alignItems: 'baseline',
          flexWrap: 'wrap',
        }}
      >
        <Kicker color={t.accent} size={9.5}>
          source
        </Kicker>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: t.inkSoft }}>
          L'historique des sessions vit dans{' '}
          <span style={{ fontFamily: MONO }}>~/.claude/projects/</span> en local, hors dépôt. Les
          entrées ci-dessous sont reconstituées depuis plan.md, CLAUDE.md et les mémoires citées —
          à brancher sur les vrais fichiers de session.
        </span>
      </div>

      {repo.sessions.map((s, i) => {
        const tn = t.tones[s.tone];
        const p = t.pills[s.outcome] || t.pills.idea;
        return (
          <div
            key={s.date + i}
            style={{
              border: `1px solid ${t.line}`,
              borderRadius: 12,
              background: t.surface,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '132px minmax(0, 1fr)',
                alignItems: 'stretch',
              }}
            >
              <div
                style={{
                  background: tn.dot,
                  color: repoKey === 'sole' ? tn.ink : '#0E1117',
                  padding: '15px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                  }}
                >
                  {s.num}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{s.date}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.8 }}>{s.turns}</span>
              </div>
              <div
                style={{
                  padding: '15px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 13,
                  minWidth: 0,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <Kicker color={t.inkFaint} size={9.5}>
                    vous
                  </Kicker>
                  <span
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      fontWeight: 600,
                      borderLeft: `3px solid ${t.accent}`,
                      paddingLeft: 12,
                    }}
                  >
                    {s.prompt}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <Kicker color={t.inkFaint} size={9.5}>
                    claude
                  </Kicker>
                  <span style={{ fontSize: 12.5, lineHeight: 1.55, color: t.inkSoft }}>
                    {s.reply}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: p.bg,
                      color: p.fg,
                      border: `1px solid ${p.border}`,
                    }}
                  >
                    {s.outcome === 'wip' ? 'en cours' : 'livré'}
                  </span>
                  {s.touched.map((f) => (
                    <span
                      key={f}
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        padding: '4px 8px',
                        borderRadius: 5,
                        background: t.surfaceAlt,
                        color: t.inkSoft,
                        border: `1px solid ${t.line}`,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div
        style={{
          border: `1px solid ${t.warnBorder}`,
          borderRadius: 12,
          background: t.warnBg,
          padding: '18px 19px',
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
          marginTop: 8,
        }}
      >
        <Kicker color={t.warnFg}>Mémoires écrites depuis ces sessions</Kicker>
        {repo.memories.map((m) => (
          <div
            key={m.file}
            style={{
              display: 'grid',
              gridTemplateColumns: '200px minmax(0, 1fr)',
              gap: 14,
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11.5,
                fontWeight: 700,
                wordBreak: 'break-word',
              }}
            >
              {m.file}
            </span>
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: t.ink }}>{m.rule}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
