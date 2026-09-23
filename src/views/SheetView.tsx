import { SourceBadge } from '../components/SourceBadge';
import type { RepoReader } from '../components/SourceBadge';
import { Kicker, MONO } from '../components/ui';
import type { RepoData, Theme } from '../data/types';
import { useNarrow } from '../lib/useMediaQuery';

interface Props {
  t: Theme;
  repo: RepoData;
  /** Vrai quand le dépôt fournit son atlas.md. */
  live: boolean;
  reader: RepoReader;
}

export function SheetView({ t, repo, live, reader }: Props) {
  const narrow = useNarrow();
  const lastSession = repo.sessions[repo.sessions.length - 1];

  return (
    <section
      style={{
        padding: '24px clamp(18px, 3.5vw, 38px) 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      <SourceBadge
        t={t}
        live={live}
        what="Ce que le projet fait et sa feuille de suivi"
        from="atlas.md"
        hint="Ce dépôt ne fournit pas d'atlas.md — ATLAS-PROMPT.md contient le prompt qui le produit."
        {...reader}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: 12,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            border: `1px solid ${t.line}`,
            borderTop: `4px solid ${t.accent}`,
            borderRadius: 12,
            background: t.surface,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
          }}
        >
          <Kicker color={t.inkFaint}>Ce que le projet fait</Kicker>
          {repo.does.map((d) => (
            <div
              key={d}
              style={{
                display: 'grid',
                gridTemplateColumns: '8px minmax(0, 1fr)',
                gap: 12,
                alignItems: 'start',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: t.accent,
                  marginTop: 7,
                }}
              />
              <span style={{ fontSize: 13, lineHeight: 1.55 }}>{d}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            border: `1px solid ${t.line}`,
            borderTop: `4px solid ${t.inkFaint}`,
            borderRadius: 12,
            background: t.surfaceAlt,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
          }}
        >
          <Kicker color={t.inkFaint}>Ce qu'il doit encore faire</Kicker>
          {repo.todo.map((d) => (
            <div
              key={d}
              style={{
                display: 'grid',
                gridTemplateColumns: '8px minmax(0, 1fr)',
                gap: 12,
                alignItems: 'start',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  border: `1px solid ${t.inkFaint}`,
                  marginTop: 7,
                }}
              />
              <span style={{ fontSize: 13, lineHeight: 1.55, color: t.inkSoft }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <Kicker color={t.inkFaint}>Dernière session</Kicker>
        <div
          style={{
            border: `1px solid ${t.line}`,
            borderLeft: `4px solid ${t.accent}`,
            borderRadius: 12,
            background: t.surface,
            padding: '18px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 20,
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Kicker color={t.inkFaint} size={9.5}>
              vous · {lastSession.date}
            </Kicker>
            <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
              {lastSession.prompt}
            </span>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Kicker color={t.inkFaint} size={9.5}>
              claude
            </Kicker>
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: t.inkSoft }}>
              {lastSession.reply}
            </span>
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
          gap: 32,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Kicker color={t.inkFaint}>Comment le projet marche</Kicker>
          <div
            style={{
              border: `1px solid ${t.line}`,
              borderRadius: 12,
              overflow: 'hidden',
              background: t.surface,
            }}
          >
            {repo.stack.map((s) => (
              <div
                key={s.cat + s.v}
                style={{
                  display: 'grid',
                  gridTemplateColumns: narrow ? '1fr' : '136px minmax(0, 1fr)',
                  gap: narrow ? 5 : 14,
                  padding: '11px 16px',
                  borderBottom: `1px solid ${t.line}`,
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: t.inkFaint,
                  }}
                >
                  {s.cat}
                </span>
                <span
                  style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{s.v}</span>
                  <span style={{ fontSize: 12, lineHeight: 1.5, color: t.inkSoft }}>
                    {s.note}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Kicker color={t.inkFaint}>Feuille de suivi</Kicker>
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
                gridTemplateColumns: narrow
                  ? 'minmax(0, 1fr) 64px 72px'
                  : 'minmax(0, 1fr) 96px 96px 104px',
                gap: 12,
                padding: '10px 16px',
                borderBottom: `1px solid ${t.line}`,
                fontFamily: MONO,
                fontSize: 9.5,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: t.inkFaint,
              }}
            >
              <span>Indicateur</span>
              <span style={{ textAlign: 'right' }}>Actuel</span>
              {!narrow && <span style={{ textAlign: 'right' }}>Cible</span>}
              <span>Avancement</span>
            </div>
            {repo.tracking.map((r) => {
              const bar = (t.pills[r.tone] || t.pills.idea).border;
              return (
                <div
                  key={r.k}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: narrow
                      ? 'minmax(0, 1fr) 64px 72px'
                      : 'minmax(0, 1fr) 96px 96px 104px',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: `1px solid ${t.line}`,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{r.k}</span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'right',
                    }}
                  >
                    {r.v}
                  </span>
                  {!narrow && (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11.5,
                        color: t.inkSoft,
                        textAlign: 'right',
                      }}
                    >
                      {r.target}
                    </span>
                  )}
                  <span
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: t.surfaceAlt,
                      overflow: 'hidden',
                      border: `1px solid ${t.line}`,
                    }}
                  >
                    <span
                      style={{ display: 'block', height: '100%', width: r.pct, background: bar }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
