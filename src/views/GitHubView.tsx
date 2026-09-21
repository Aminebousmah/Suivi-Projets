import { useState } from 'react';
import { Kicker, MONO } from '../components/ui';
import type { RepoData, Theme } from '../data/types';
import type { MatchKind } from '../lib/verify';
import { isResolved } from '../lib/verify';
import { useGitHub, writeToken } from '../lib/useGitHub';

interface Props {
  t: Theme;
  repo: RepoData;
  token: string;
  setToken: (v: string) => void;
}

const KIND_HINT: Record<MatchKind, string> = {
  exact: 'chemin exact',
  partiel: 'retrouvé sous un autre préfixe',
  dossier: 'dossier présent',
  motif: 'motif résolu',
  déplacé: 'fichier déplacé',
  absent: 'introuvable dans le dépôt',
};

function humanDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function humanSize(bytes: number): string {
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1).replace('.', ',') + ' Mo';
  if (bytes >= 1000) return (bytes / 1000).toFixed(1).replace('.', ',') + ' ko';
  return bytes + ' o';
}

export function GitHubView({ t, repo, token, setToken }: Props) {
  const [draft, setDraft] = useState(token);
  const [connect, setConnect] = useState(false);
  const { state, reload } = useGitHub(repo, token, connect);

  const card = {
    border: `1px solid ${t.line}`,
    borderRadius: 12,
    background: t.surface,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 13,
  };

  const button = (primary: boolean) => ({
    appearance: 'none' as const,
    cursor: 'pointer',
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    padding: '9px 16px',
    borderRadius: 999,
    border: `1px solid ${primary ? t.accent : t.line}`,
    background: primary ? t.accent : 'transparent',
    color: primary ? t.onAccent : t.inkSoft,
  });

  return (
    <section
      style={{
        padding: '24px clamp(18px, 3.5vw, 38px) 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div style={card}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Kicker color={t.inkFaint}>Source réelle</Kicker>
          <span style={{ fontFamily: MONO, fontSize: 11, color: t.inkSoft }}>{repo.slug}</span>
        </div>
        <span style={{ fontSize: 12.5, lineHeight: 1.55, color: t.inkSoft }}>
          Les autres vues décrivent le projet tel qu'il a été documenté. Celle-ci interroge
          l'API GitHub et confronte cette description au dépôt réel. Le jeton reste dans ce
          navigateur et n'est envoyé qu'à api.github.com ; sans lui, seuls les dépôts publics
          répondent, dans la limite de soixante requêtes par heure.
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="password"
            value={draft}
            placeholder="jeton personnel GitHub (facultatif)"
            onChange={(e) => setDraft(e.target.value)}
            style={{
              flex: '1 1 280px',
              minWidth: 0,
              fontFamily: MONO,
              fontSize: 12,
              padding: '9px 12px',
              borderRadius: 8,
              border: `1px solid ${t.line}`,
              background: t.surfaceAlt,
              color: t.ink,
            }}
          />
          <button
            onClick={() => {
              setToken(draft);
              writeToken(draft);
              setConnect(true);
              if (connect) reload();
            }}
            style={button(true)}
          >
            {state.status === 'ready' ? 'Recharger' : 'Interroger GitHub'}
          </button>
          {token && (
            <button
              onClick={() => {
                setDraft('');
                setToken('');
                writeToken('');
              }}
              style={button(false)}
            >
              Oublier le jeton
            </button>
          )}
        </div>
      </div>

      {state.status === 'loading' && (
        <div style={{ ...card, borderLeft: `4px solid ${t.accent}` }}>
          <span style={{ fontSize: 13, color: t.inkSoft }}>Lecture du dépôt en cours…</span>
        </div>
      )}

      {state.status === 'error' && (
        <div
          style={{
            ...card,
            background: t.warnBg,
            border: `1px solid ${t.warnBorder}`,
          }}
        >
          <Kicker color={t.warnFg}>GitHub a refusé la demande</Kicker>
          <span style={{ fontSize: 13, lineHeight: 1.55, color: t.ink }}>{state.message}</span>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: 12,
            }}
          >
            <div style={card}>
              <Kicker color={t.inkFaint}>Dépôt</Kicker>
              {[
                ['nom', state.data.meta.fullName],
                ['visibilité', state.data.meta.private ? 'privé' : 'public'],
                ['branche par défaut', state.data.meta.defaultBranch],
                ['langage principal', state.data.meta.language ?? '—'],
                ['dernier push', humanDate(state.data.meta.pushedAt)],
                [
                  'fichiers suivis',
                  state.data.tree.entries.filter((e) => e.type === 'blob').length +
                    (state.data.tree.truncated ? ' (tronqué)' : ''),
                ],
                [
                  'poids du code',
                  humanSize(state.data.tree.entries.reduce((a, e) => a + e.size, 0)),
                ],
              ].map(([k, v]) => (
                <div
                  key={k as string}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px minmax(0, 1fr)',
                    gap: 12,
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
                    {k}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={card}>
              <Kicker color={t.inkFaint}>Fichiers déclarés vérifiés</Kicker>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span
                  style={{
                    fontFamily: t.display,
                    fontWeight: Number(t.displayWeight),
                    fontSize: 38,
                    lineHeight: 1,
                    color: state.data.check.missing ? t.statusFg.wip : t.statusFg.live,
                  }}
                >
                  {state.data.check.resolved}/{state.data.check.total}
                </span>
                <span style={{ fontSize: 12.5, color: t.inkSoft }}>
                  chemins cités par les fonctionnalités retrouvés dans le dépôt
                </span>
              </span>
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
                  style={{
                    display: 'block',
                    height: '100%',
                    width:
                      (state.data.check.total
                        ? (state.data.check.resolved / state.data.check.total) * 100
                        : 0) + '%',
                    background: t.statusFg.live,
                  }}
                />
              </span>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: t.inkSoft }}>
                {state.data.check.missing === 0
                  ? 'Chaque fichier cité existe : la description colle au dépôt.'
                  : `${state.data.check.missing} chemin(s) cité(s) n'existent pas ou plus — à corriger dans les données, ou à créer dans le dépôt.`}
              </span>
            </div>
          </div>

          {state.data.check.missing > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <Kicker color={t.inkFaint}>Écarts entre la description et le dépôt</Kicker>
              <div
                style={{
                  border: `1px solid ${t.line}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: t.surface,
                }}
              >
                {state.data.check.domains
                  .filter((d) => d.missing > 0)
                  .flatMap((d) =>
                    d.checks
                      .filter((c) => !isResolved(c.kind))
                      .map((c) => (
                        <div
                          key={d.key + c.declared}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 150px',
                            gap: 14,
                            padding: '11px 16px',
                            borderBottom: `1px solid ${t.line}`,
                            alignItems: 'baseline',
                          }}
                        >
                          <span style={{ fontFamily: MONO, fontSize: 11.5, wordBreak: 'break-word' }}>
                            {c.path}
                          </span>
                          <span style={{ fontSize: 12, color: t.inkSoft }}>{d.name}</span>
                          <span
                            style={{
                              fontFamily: MONO,
                              fontSize: 9.5,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: t.warnFg,
                              textAlign: 'right',
                            }}
                          >
                            {KIND_HINT[c.kind]}
                          </span>
                        </div>
                      )),
                  )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <Kicker color={t.inkFaint}>Derniers commits sur la branche</Kicker>
            <div
              style={{
                border: `1px solid ${t.line}`,
                borderRadius: 12,
                overflow: 'hidden',
                background: t.surface,
              }}
            >
              {state.data.commits.map((c) => (
                <div
                  key={c.sha}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '84px 110px minmax(0, 1fr)',
                    gap: 14,
                    padding: '11px 16px',
                    borderBottom: `1px solid ${t.line}`,
                    alignItems: 'baseline',
                  }}
                >
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: MONO, fontSize: 11, color: t.statusFg.live }}
                  >
                    {c.shortSha}
                  </a>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.inkFaint }}>
                    {humanDate(c.date)}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>
                      {c.message.split('\n')[0]}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.inkSoft }}>
                      {c.author}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
