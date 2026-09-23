import { useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BLURBS, VIEWS } from './data/labels';
import { REPOS } from './data/repos';
import { CHROME, THEMES } from './data/themes';
import { useAtlasState } from './lib/useAtlasState';
import { useCenteredActive, useNarrow } from './lib/useMediaQuery';
import { readConnected, readToken, useGitHub, writeConnected } from './lib/useGitHub';
import { ArchView } from './views/ArchView';
import { ContextView } from './views/ContextView';
import { GitHubView } from './views/GitHubView';
import { ProgressView } from './views/ProgressView';
import { SessionsView } from './views/SessionsView';
import { SheetView } from './views/SheetView';

const MONO = "'JetBrains Mono', monospace";

export default function App() {
  const [state, navigate] = useAtlasState();
  const narrow = useNarrow();
  const repoStrip = useRef<HTMLDivElement>(null);
  const viewStrip = useRef<HTMLElement>(null);
  const [token, setToken] = useState(readToken);
  const [connected, setConnected] = useState(readConnected);
  const { repo: repoKey, view, viz, domain: domainKey, feat: featName, zoom } = state;

  const t = THEMES[repoKey];
  const repo = REPOS[repoKey];

  // Un seul chargement du dépôt pour toutes les vues qui en dépendent.
  const { state: source, reload } = useGitHub(repo, token, connected);
  const live = source.status === 'ready' ? source.data.context : null;

  // Un dépôt qui fournit atlas.md décrit lui-même son arbre et son suivi :
  // la description figée n'est plus qu'un repli.
  const described = live?.atlas
    ? { ...repo, domains: live.atlas.domains, tracking: live.atlas.tracking.length ? live.atlas.tracking : repo.tracking, does: live.atlas.does.length ? live.atlas.does : repo.does, todo: live.atlas.todo.length ? live.atlas.todo : repo.todo }
    : repo;

  const connect = (nextToken: string) => {
    setToken(nextToken);
    setConnected(true);
    writeConnected(true);
    if (connected) reload();
  };

  // Lire le dépôt depuis n'importe quelle vue, sans passer par l'onglet 06 ;
  // après un échec, le même bouton relance.
  const reader = {
    onConnect: !connected || source.status === 'error' ? () => connect(token) : undefined,
    loading: source.status === 'loading',
  };

  const disconnect = () => {
    setConnected(false);
    writeConnected(false);
  };

  useCenteredActive(repoStrip, repoKey);
  useCenteredActive(viewStrip, view);

  useEffect(() => {
    document.title = `Atlas — ${repo.label}`;
  }, [repo.label]);

  // Le liseré de focus suit la palette du dépôt : aucune couleur en dur.
  useEffect(() => {
    document.documentElement.style.setProperty('--focus', t.accent);
  }, [t.accent]);

  const repoTabs = useMemo(
    () =>
      Object.keys(REPOS).map((k) => ({
        key: k,
        label: REPOS[k].label,
        dot: THEMES[k].accent,
        bg: k === repoKey ? THEMES[k].primary : 'transparent',
        fg: k === repoKey ? THEMES[k].onPrimary : CHROME.inkSoft,
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
        ref={repoStrip}
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: CHROME.bar,
          color: CHROME.ink,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          scrollbarWidth: 'none',
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
            onClick={() => navigate({ repo: r.key })}
            aria-current={r.key === repoKey ? 'true' : undefined}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              border: 'none',
              padding: narrow ? '12px 14px' : '12px 20px',
              background: r.bg,
              color: r.fg,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: 'none',
              whiteSpace: 'nowrap',
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
        {!narrow && (
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
        )}
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
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'flex-end',
              width: narrow ? '100%' : 'auto',
            }}
          >
            <div
              style={{
                display: narrow ? 'grid' : 'flex',
                gridTemplateColumns: narrow ? '1fr 1fr' : undefined,
                width: narrow ? '100%' : 'auto',
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
                display: narrow ? 'none' : 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 4,
                borderRadius: 6,
                background: CHROME.swatchTray,
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

        <nav
          ref={viewStrip}
          aria-label="Vues"
          style={{
            display: 'flex',
            gap: 4,
            marginTop: narrow ? 18 : 24,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => navigate({ view: v.id })}
              aria-current={v.id === view ? 'page' : undefined}
              style={{
                flex: 'none',
                whiteSpace: 'nowrap',
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

      <ErrorBoundary
        key={repoKey + ':' + view}
        t={t}
        onRecover={() => navigate({ view: 'sheet', domain: null, feat: null })}
      >
        {view === 'sheet' && <SheetView t={t} repo={described} live={!!live?.atlas} reader={reader} />}
        {view === 'arch' && (
          <ArchView
            t={t}
            repo={described}
            viz={viz}
            src={state.src}
            treeDomains={source.status === 'ready' ? source.data.treeDomains : null}
            check={source.status === 'ready' ? source.data.check : null}
            fromAtlasFile={!!live?.atlas}
            reader={reader}
            domainKey={domainKey}
            featName={featName}
            zoom={zoom}
            navigate={navigate}
          />
        )}
        {view === 'sessions' && <SessionsView t={t} repo={repo} />}
        {view === 'context' && <ContextView t={t} repo={repo} live={live} reader={reader} />}
        {view === 'progress' && <ProgressView t={t} repo={repo} live={live} reader={reader} />}
        {view === 'github' && (
          <GitHubView
            t={t}
            repo={repo}
            token={token}
            source={source}
            connected={connected}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}
