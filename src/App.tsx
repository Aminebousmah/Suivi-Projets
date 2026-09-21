import { useMemo, useState } from 'react';
import { BLURBS, VIEWS } from './data/labels';
import { REPOS } from './data/repos';
import { THEMES } from './data/themes';
import type { ViewId, VizMode } from './data/types';
import { ArchView } from './views/ArchView';
import { ContextView } from './views/ContextView';
import { ProgressView } from './views/ProgressView';
import { SessionsView } from './views/SessionsView';
import { SheetView } from './views/SheetView';

const MONO = "'JetBrains Mono', monospace";

export default function App() {
  const [repoKey, setRepoKey] = useState<string>('sole');
  const [view, setView] = useState<ViewId>('sheet');
  const [viz, setViz] = useState<VizMode>('graph');
  const [domainKey, setDomainKey] = useState<string | null>(null);
  const [featName, setFeatName] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.62);

  const t = THEMES[repoKey];
  const repo = REPOS[repoKey];

  const selectRepo = (k: string) => {
    setRepoKey(k);
    setDomainKey(null);
    setFeatName(null);
  };

  const repoTabs = useMemo(
    () =>
      Object.keys(REPOS).map((k) => ({
        key: k,
        label: REPOS[k].label,
        dot: THEMES[k].accent,
        bg: k === repoKey ? THEMES[k].primary : 'transparent',
        fg: k === repoKey ? THEMES[k].onPrimary : 'rgba(250,250,248,0.6)',
      })),
    [repoKey],
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: t.page,
        color: t.ink,
        fontFamily: 'Manrope, Helvetica, sans-serif',
        textWrap: 'pretty',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: '#101014',
          color: '#FAFAF8',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '14px 18px',
            opacity: 0.55,
            whiteSpace: 'nowrap',
          }}
        >
          Atlas
        </span>
        {repoTabs.map((r) => (
          <button
            key={r.key}
            onClick={() => selectRepo(r.key)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              border: 'none',
              padding: '12px 20px',
              background: r.bg,
              color: r.fg,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                background: r.dot,
                flex: 'none',
              }}
            />
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500 }}>{r.label}</span>
          </button>
        ))}
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: MONO,
            fontSize: 10.5,
            padding: '14px 18px',
            opacity: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {t.source}
        </span>
      </div>

      <header
        style={{
          background: t.primary,
          color: t.onPrimary,
          padding: '26px clamp(18px, 3.5vw, 38px) 0',
          borderBottom: `1px solid ${t.hairline}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 26,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: t.accent,
              }}
            >
              {repo.slug}
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: t.display,
                fontWeight: Number(t.displayWeight),
                fontSize: 'clamp(26px, 3.3vw, 40px)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              {repo.titleA}
              <em style={{ color: t.accent, fontStyle: t.emStyle }}>{repo.titleB}</em>
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: '58ch',
                fontSize: 13.5,
                lineHeight: 1.55,
                color: t.onPrimarySoft,
              }}
            >
              {repo.tagline}
            </p>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}
          >
            <div
              style={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                borderRadius: 10,
                overflow: 'hidden',
                background: t.hairline,
              }}
            >
              {repo.stats.map((s) => (
                <div
                  key={s.k}
                  style={{
                    background: t.primary,
                    padding: '11px 16px',
                    minWidth: 82,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span
                    style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: t.accent }}
                  >
                    {s.v}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: t.onPrimarySoft,
                    }}
                  >
                    {s.k}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 4,
                borderRadius: 6,
                background: '#7A7A82',
              }}
            >
              {t.swatches.map((w) => (
                <span
                  key={w.hex}
                  title={w.title}
                  style={{ width: 34, height: 19, borderRadius: 3, background: w.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 4, marginTop: 24, flexWrap: 'wrap' }}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                appearance: 'none',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '11px 19px',
                background: v.id === view ? t.accent : 'transparent',
                color: v.id === view ? t.onAccent : t.onPrimary,
                display: 'flex',
                alignItems: 'baseline',
                gap: 9,
              }}
            >
              <span
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', opacity: 0.6 }}
              >
                {v.num}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{v.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <div
        style={{
          background: t.accent,
          color: t.onAccent,
          padding: '11px clamp(18px, 3.5vw, 38px)',
          fontFamily: MONO,
          fontSize: 11.5,
          letterSpacing: '0.03em',
        }}
      >
        {BLURBS[view]}
      </div>

      {view === 'sheet' && <SheetView t={t} repo={repo} />}
      {view === 'arch' && (
        <ArchView
          t={t}
          repo={repo}
          viz={viz}
          setViz={setViz}
          domainKey={domainKey}
          featName={featName}
          setDomainKey={setDomainKey}
          setFeatName={setFeatName}
          zoom={zoom}
          setZoom={setZoom}
        />
      )}
      {view === 'sessions' && <SessionsView t={t} repo={repo} repoKey={repoKey} />}
      {view === 'context' && <ContextView t={t} repo={repo} />}
      {view === 'progress' && <ProgressView t={t} repo={repo} />}
    </div>
  );
}
