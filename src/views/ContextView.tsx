import { SourceBadge } from '../components/SourceBadge';
import { Kicker, MONO } from '../components/ui';
import type { RepoData, Theme } from '../data/types';
import type { LiveContext } from '../lib/context';

interface Props {
  t: Theme;
  repo: RepoData;
  live: LiveContext | null;
}

export function ContextView({ t, repo, live }: Props) {
  // Le dépôt a le dernier mot quand il a été lu — mais seulement sur ce qu'il
  // porte vraiment : un CLAUDE.md sans section « à ne jamais faire » ne doit pas
  // effacer les interdits déjà décrits.
  const ctxFiles = live?.ctxFiles.length ? live.ctxFiles : repo.ctxFiles;
  const ctxRules = live?.ctxRules.length ? live.ctxRules : repo.ctxRules;
  const ctxNever = live?.ctxNever.length ? live.ctxNever : repo.ctxNever;
  const fromFiles = live?.found.length ? live.found.join(', ') : 'CLAUDE.md et README.md';

  return (
    <section
      style={{
        padding: '24px clamp(18px, 3.5vw, 38px) 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
      }}
    >
      <SourceBadge
        t={t}
        live={!!live?.found.length}
        what="Les fichiers, règles et interdits"
        from={fromFiles}
      />

      {live && (live.absent.length > 0 || live.unreadable.length > 0) && (
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: t.inkSoft, marginTop: -18 }}>
          {live.absent.length > 0 && `Absent du dépôt : ${live.absent.join(', ')}. `}
          {live.unreadable.length > 0 &&
            `Non lu cette fois : ${live.unreadable.join(', ')}.`}
        </span>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(262px, 1fr))',
          gap: 10,
        }}
      >
        {ctxFiles.map((f) => {
          const tn = t.tones[f.tone];
          return (
            <div
              key={f.name}
              style={{
                border: `1px solid ${tn.border}`,
                borderRadius: 12,
                background: tn.bg,
                color: tn.ink,
                padding: '17px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 11,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700 }}>
                  {f.name}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: tn.inkSoft }}>
                  {f.size}
                </span>
              </div>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: tn.inkSoft }}>{f.role}</span>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {f.chips.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      padding: '4px 7px',
                      borderRadius: 5,
                      background: tn.chipBg,
                      color: tn.ink,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(292px, 1fr))',
          gap: 30,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Kicker color={t.inkFaint}>Règles actives</Kicker>
          {ctxRules.map((r) => (
            <div
              key={r}
              style={{
                display: 'grid',
                gridTemplateColumns: '8px minmax(0, 1fr)',
                gap: 12,
                alignItems: 'start',
                paddingBottom: 12,
                borderBottom: `1px solid ${t.line}`,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: t.accent,
                  marginTop: 6,
                }}
              />
              <span style={{ fontSize: 13, lineHeight: 1.5 }}>{r}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              border: `1px solid ${t.warnBorder}`,
              borderRadius: 12,
              background: t.warnBg,
              padding: '18px 19px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <Kicker color={t.warnFg}>À ne jamais faire</Kicker>
            {ctxNever.map((n) => (
              <span key={n} style={{ fontSize: 12.5, lineHeight: 1.5, color: t.ink }}>
                {n}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Kicker color={t.inkFaint}>Décisions encore ouvertes</Kicker>
            {repo.ctxOpen.map((o) => (
              <div
                key={o}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '9px minmax(0, 1fr)',
                  gap: 12,
                  alignItems: 'start',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    border: `1px solid ${t.accent}`,
                    marginTop: 6,
                  }}
                />
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: t.inkSoft }}>{o}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
