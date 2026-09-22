import { useRef, useState } from 'react';
import { SourceBadge } from '../components/SourceBadge';
import { Kicker, MONO } from '../components/ui';
import type { RepoData, Theme } from '../data/types';
import type { ParsedSession } from '../lib/sessions';
import { clamp, parseSessionFiles, shortDate } from '../lib/sessions';

interface Props {
  t: Theme;
  repo: RepoData;
  repoKey: string;
}

export function SessionsView({ t, repo, repoKey }: Props) {
  const [imported, setImported] = useState<ParsedSession[]>([]);
  const [unreadable, setUnreadable] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const ingest = async (files: FileList | null) => {
    if (!files?.length) return;
    const read = await Promise.all(
      [...files].map(async (f) => ({ name: f.name, text: await f.text() })),
    );
    const { sessions, unreadable: skipped } = parseSessionFiles(read);
    setImported(sessions);
    setUnreadable(skipped);
  };

  if (imported.length > 0) {
    return (
      <ImportedSessions
        t={t}
        sessions={imported}
        unreadable={unreadable}
        onReset={() => {
          setImported([]);
          setUnreadable([]);
        }}
      />
    );
  }

  return (
    <section
      style={{
        padding: '24px clamp(18px, 3.5vw, 38px) 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <SourceBadge
        t={t}
        live={false}
        what="Les sessions"
        hint="Déposez vos fichiers de session ci-dessous pour lire les vraies."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void ingest(e.dataTransfer.files);
        }}
        style={{
          border: `1px dashed ${over ? t.accent : t.line}`,
          borderRadius: 12,
          background: over ? t.surfaceAlt : t.surface,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
        }}
      >
        <Kicker color={t.inkFaint}>Lire vos vraies sessions</Kicker>
        <span style={{ fontSize: 12.5, lineHeight: 1.6, color: t.inkSoft }}>
          L'historique vit dans{' '}
          <span style={{ fontFamily: MONO }}>~/.claude/projects/&lt;projet&gt;/*.jsonl</span>, sur
          votre machine et hors dépôt : un navigateur ne peut pas aller l'y chercher. Déposez ces
          fichiers ici, ou choisissez-les — ils sont lus dans cette page, et ne partent nulle part.
        </span>
        <input
          ref={input}
          type="file"
          multiple
          accept=".jsonl,.json,application/json"
          onChange={(e) => void ingest(e.target.files)}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => input.current?.click()}
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
          Choisir des fichiers de session
        </button>
        {unreadable.length > 0 && (
          <span style={{ fontSize: 12, color: t.inkSoft }}>
            Rien d'exploitable dans : {unreadable.join(', ')}.
          </span>
        )}
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

interface ImportedProps {
  t: Theme;
  sessions: ParsedSession[];
  unreadable: string[];
  onReset: () => void;
}

/** Les sessions telles qu'elles se lisent dans les fichiers déposés. */
function ImportedSessions({ t, sessions, unreadable, onReset }: ImportedProps) {
  const exchanges = sessions.reduce((a, s) => a + s.exchanges.length, 0);
  const skipped = sessions.reduce((a, s) => a + s.skipped, 0);

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
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          flexWrap: 'wrap',
          padding: '10px 14px',
          borderRadius: 9,
          border: `1px solid ${t.statusFg.live}`,
        }}
      >
        <Kicker color={t.statusFg.live} size={9.5}>
          lu dans vos fichiers
        </Kicker>
        <span style={{ fontSize: 12, lineHeight: 1.5, color: t.inkSoft }}>
          {sessions.length} session(s), {exchanges} échange(s)
          {skipped > 0 && `, ${skipped} ligne(s) non interprétée(s)`}
          {unreadable.length > 0 && `, ${unreadable.length} fichier(s) sans rien d'exploitable`}.
          Rien n'a quitté cette page.
        </span>
        <button
          onClick={onReset}
          style={{
            marginLeft: 'auto',
            appearance: 'none',
            cursor: 'pointer',
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '7px 14px',
            borderRadius: 999,
            border: `1px solid ${t.line}`,
            background: 'transparent',
            color: t.inkSoft,
          }}
        >
          Oublier ces fichiers
        </button>
      </div>

      {sessions.map((s, i) => (
        <div
          key={s.id + i}
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
                background: t.tones[(['a', 'b', 'c', 'd'] as const)[i % 4]].dot,
                color: t.page,
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
                  opacity: 0.85,
                }}
              >
                session
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>
                {shortDate(s.started)}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.85 }}>
                {s.exchanges.length} échange(s)
              </span>
            </div>

            <div
              style={{
                padding: '15px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                minWidth: 0,
              }}
            >
              {s.exchanges.slice(0, 6).map((e, j) => (
                <div
                  key={j}
                  style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      fontWeight: 600,
                      borderLeft: `3px solid ${t.accent}`,
                      paddingLeft: 12,
                    }}
                  >
                    {clamp(e.prompt, 220)}
                  </span>
                  {e.reply && (
                    <span style={{ fontSize: 12.5, lineHeight: 1.55, color: t.inkSoft }}>
                      {clamp(e.reply, 320)}
                    </span>
                  )}
                  {e.tools.length > 0 && (
                    <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {[...new Set(e.tools)].map((tool) => (
                        <span
                          key={tool}
                          style={{
                            fontFamily: MONO,
                            fontSize: 9.5,
                            padding: '3px 7px',
                            borderRadius: 5,
                            background: t.surfaceAlt,
                            color: t.inkSoft,
                            border: `1px solid ${t.line}`,
                          }}
                        >
                          {tool}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              ))}

              {s.exchanges.length > 6 && (
                <span style={{ fontSize: 12, color: t.inkFaint }}>
                  … et {s.exchanges.length - 6} échange(s) de plus dans ce fichier.
                </span>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {s.tools.slice(0, 6).map(([name, n]) => (
                  <span
                    key={name}
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      padding: '4px 8px',
                      borderRadius: 5,
                      background: t.surfaceAlt,
                      color: t.ink,
                      border: `1px solid ${t.line}`,
                    }}
                  >
                    {name} ×{n}
                  </span>
                ))}
              </div>

              {s.files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Kicker color={t.inkFaint} size={9.5}>
                    Fichiers touchés
                  </Kicker>
                  <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {s.files.slice(0, 10).map((f) => (
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
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
