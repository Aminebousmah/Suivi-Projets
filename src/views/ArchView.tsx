import { HoverButton, Kicker, MONO } from '../components/ui';
import { LABELS, ORDER } from '../data/labels';
import type { Domain, RepoData, Theme, TreeSource, VizMode } from '../data/types';
import { CANVAS_WIDTH, buildMap, buildOverview } from '../lib/graph';
import type { AtlasState } from '../lib/url';
import { ZOOM_STEPS } from '../lib/url';

interface Props {
  t: Theme;
  repo: RepoData;
  viz: VizMode;
  src: TreeSource;
  /** Domaines déduits du dépôt, absents tant qu'il n'est pas connecté. */
  treeDomains: Domain[] | null;
  domainKey: string | null;
  featName: string | null;
  zoom: number;
  navigate: (patch: Partial<AtlasState>) => void;
}

export function ArchView({
  t,
  repo,
  viz,
  src,
  treeDomains,
  domainKey,
  featName,
  zoom,
  navigate,
}: Props) {
  const fromRepo = src === 'repo';
  const domains = fromRepo ? (treeDomains ?? []) : repo.domains;
  const hasStatuses = domains.some((d) => d.features.some((f) => f.status));
  const domain = domainKey ? domains.find((d) => d.key === domainKey) ?? null : null;
  const feat = domain && featName ? domain.features.find((f) => f.name === featName) ?? null : null;

  const pill = (s: string | undefined) => (s && t.pills[s]) || t.pills.idea;
  /** Un élément sans statut affiche le fait qu'on connaît de lui. */
  const badge = (f: { status?: string; meta?: string }) =>
    f.status ? LABELS[f.status as keyof typeof LABELS] : (f.meta ?? '—');
  const map = buildMap(domains, t, domainKey, featName);
  const { overview, projectSegs, projectCounts } = buildOverview(domains, t, domainKey);

  const openDomain = (k: string) => navigate({ domain: k, feat: null });
  const openFeat = (k: string, name: string) => navigate({ domain: k, feat: name });
  const reset = () => navigate({ domain: null, feat: null });

  const hubTone = t.tones.a;
  const hubCount = domains.reduce((a, d) => a + d.features.length, 0);
  const isGraph = viz === 'graph';
  const isList = viz === 'list' && !domain;
  const inDomain = viz === 'list' && !!domain;

  const crumbs = domain
    ? [
        {
          label: repo.label,
          onClick: reset,
          weight: 500,
          color: t.inkSoft,
          sep: '/',
        },
        {
          label: domain.name,
          onClick: () => navigate({ feat: null }),
          weight: 700,
          color: t.tones[domain.tone].dot,
          sep: feat ? '/' : '',
        },
        ...(feat
          ? [{ label: feat.name, onClick: () => {}, weight: 700, color: t.ink, sep: '' }]
          : []),
      ]
    : [{ label: repo.label, onClick: () => {}, weight: 700, color: t.ink, sep: '' }];

  let panel: {
    kicker: string;
    title: string;
    role: string;
    titleColor: string;
    hasStatus: boolean;
    status: string;
    pillBg: string;
    pillFg: string;
    pillBorder: string;
    files: string[];
    notesLabel: string;
    notes: string[];
  };
  if (feat && domain) {
    const p = pill(feat.status);
    panel = {
      kicker: (fromRepo ? 'Fichier · ' : 'Fonctionnalité · ') + domain.name,
      title: feat.name,
      role: feat.what,
      titleColor: t.ink,
      hasStatus: true,
      status: badge(feat),
      pillBg: p.bg,
      pillFg: p.fg,
      pillBorder: p.border,
      files: feat.files,
      notesLabel: "Ce qu'il faut savoir",
      notes: feat.notes ?? [],
    };
  } else if (domain) {
    panel = {
      kicker: (fromRepo ? 'Dossier ' : 'Domaine ') + domain.num,
      title: domain.name,
      role: domain.detail,
      titleColor: t.tones[domain.tone].dot,
      hasStatus: false,
      status: '',
      pillBg: 'transparent',
      pillFg: t.inkSoft,
      pillBorder: t.line,
      files: [],
      notesLabel: domain.features.some((f) => f.status) ? 'Fonctionnalités' : 'Contenu',
      notes: domain.features.map((f) => f.name + ' — ' + badge(f)),
    };
  } else {
    panel = {
      kicker: fromRepo ? 'Arborescence' : 'Projet',
      title: repo.label,
      role: fromRepo
        ? `Dossiers et fichiers du dépôt, tels qu'ils y sont. ${domains.length} groupe(s).`
        : repo.tagline,
      titleColor: t.accent,
      hasStatus: false,
      status: '',
      pillBg: 'transparent',
      pillFg: t.inkSoft,
      pillBorder: t.line,
      files: [],
      notesLabel: fromRepo ? 'Groupes' : 'Domaines',
      notes: domains.map(
        (d) => d.name + ' — ' + d.features.length + (fromRepo ? ' élément(s)' : ' fonctionnalités'),
      ),
    };
  }

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 620px), 1fr))',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          padding: '20px clamp(18px, 3.5vw, 38px) 44px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          {crumbs.map((c) => (
            <span key={c.label} style={{ display: 'contents' }}>
              <button
                onClick={c.onClick}
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: MONO,
                  fontSize: 12.5,
                  fontWeight: c.weight,
                  color: c.color,
                }}
              >
                {c.label}
              </button>
              <span style={{ fontFamily: MONO, fontSize: 12, color: t.inkFaint }}>{c.sep}</span>
            </span>
          ))}
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {(
              [
                { id: 'described', label: 'Décrit' },
                { id: 'repo', label: 'Dépôt' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => navigate({ src: m.id })}
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: 10.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: `1px solid ${m.id === src ? t.ink : t.line}`,
                  background: m.id === src ? t.ink : 'transparent',
                  color: m.id === src ? t.page : t.inkSoft,
                }}
              >
                {m.label}
              </button>
            ))}
            <span style={{ width: 10 }} />
            {(
              [
                { id: 'graph', label: 'Graphe' },
                { id: 'list', label: 'Liste' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => navigate({ viz: m.id })}
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: 10.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: `1px solid ${m.id === viz ? t.accent : t.line}`,
                  background: m.id === viz ? t.accent : 'transparent',
                  color: m.id === viz ? t.onAccent : t.inkSoft,
                }}
              >
                {m.label}
              </button>
            ))}
          </span>
        </div>

        {fromRepo && domains.length === 0 && (
          <div
            style={{
              border: `1px dashed ${t.line}`,
              borderRadius: 12,
              background: t.surfaceAlt,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <Kicker color={t.inkFaint}>Arbre du dépôt</Kicker>
            <span style={{ fontSize: 13, lineHeight: 1.6, color: t.inkSoft }}>
              Cet arbre est construit depuis l'arborescence réelle : dossiers et fichiers, avec
              leur poids et ce que les derniers commits ont touché. Aucun statut n'y figure —
              rien dans une arborescence ne dit qu'une chose est en cours ou gelée. Connectez le
              dépôt depuis la vue « Dépôt réel » pour le voir.
            </span>
          </div>
        )}

        {isGraph && domains.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                border: `1px solid ${t.line}`,
                borderRadius: 12,
                background: t.surface,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <Kicker color={t.inkFaint} size={9.5}>
                  État du projet
                </Kicker>
                <span style={{ fontFamily: MONO, fontSize: 11, color: t.inkSoft }}>
                  {projectCounts}
                </span>
              </div>
              <div
                style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 }}
              >
                {projectSegs.map((s) => (
                  <span key={s.key} title={s.label} style={{ width: s.w, background: s.bg }} />
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  borderTop: `1px solid ${t.line}`,
                  paddingTop: 10,
                }}
              >
                {overview.map((o) => (
                  <HoverButton
                    key={o.key}
                    onClick={() => openDomain(o.key)}
                    hoverBackground={t.surfaceAlt}
                    style={{
                      appearance: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      boxSizing: 'border-box',
                      textAlign: 'left',
                      border: 'none',
                      borderRadius: 7,
                      background: o.rowBg,
                      padding: '7px 9px',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) minmax(90px, 150px) 132px 34px',
                      gap: 14,
                      alignItems: 'center',
                      color: t.ink,
                    }}
                  >
                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: o.dot,
                          flex: 'none',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {o.name}
                      </span>
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        height: 8,
                        borderRadius: 4,
                        overflow: 'hidden',
                        gap: 2,
                      }}
                    >
                      {o.segs.map((s) => (
                        <span
                          key={s.key}
                          title={s.label}
                          style={{ width: s.w, background: s.bg }}
                        />
                      ))}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10.5,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: o.stateFg,
                      }}
                    >
                      {o.state}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: t.inkSoft,
                        textAlign: 'right',
                      }}
                    >
                      {o.total}
                    </span>
                  </HoverButton>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span
                style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}
              >
                {hasStatuses ? (
                  <>
                    <Kicker color={t.inkSoft} size={9.5}>
                      état
                    </Kicker>
                    {ORDER.map((s) => (
                      <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: t.statusFg[s],
                          }}
                        />
                        <span style={{ fontSize: 11.5, color: t.inkSoft }}>{LABELS[s]}</span>
                      </span>
                    ))}
                  </>
                ) : (
                  <>
                    <Kicker color={t.inkSoft} size={9.5}>
                      lecture
                    </Kicker>
                    <span style={{ fontSize: 11.5, color: t.inkSoft }}>
                      chaque feuille porte son poids, ou ce que les derniers commits y ont fait
                    </span>
                  </>
                )}
              </span>
              <span
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: t.inkFaint,
                    marginRight: 4,
                  }}
                >
                  zoom
                </span>
                {ZOOM_STEPS.map((z) => {
                  const on = Math.abs(z - zoom) < 0.001;
                  return (
                    <button
                      key={z}
                      onClick={() => navigate({ zoom: z })}
                      style={{
                        appearance: 'none',
                        cursor: 'pointer',
                        fontFamily: MONO,
                        fontSize: 10.5,
                        padding: '6px 11px',
                        borderRadius: 999,
                        border: `1px solid ${on ? t.accent : t.line}`,
                        background: on ? t.accent : 'transparent',
                        color: on ? t.onAccent : t.inkSoft,
                      }}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  );
                })}
              </span>
            </div>

            <div
              style={{
                border: `1px solid ${t.line}`,
                borderRadius: 14,
                background: t.surface,
                overflow: 'auto',
                maxHeight: '76vh',
                minHeight: 520,
              }}
            >
              <div
                style={{
                  width: Math.round(CANVAS_WIDTH * zoom) + 'px',
                  height: Math.round(parseFloat(map.canvasH) * zoom) + 'px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: `scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: map.canvasW,
                    height: map.canvasH,
                  }}
                >
                  <svg
                    viewBox={map.viewBox}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: map.canvasW,
                      height: map.canvasH,
                    }}
                  >
                    {map.mapEdges.map((e) => (
                      <path
                        key={e.key}
                        d={e.d}
                        fill="none"
                        stroke={e.stroke}
                        strokeWidth={e.w}
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>

                  <button
                    onClick={reset}
                    style={{
                      position: 'absolute',
                      left: map.rootLeft,
                      top: map.rootTop,
                      width: map.rootW,
                      appearance: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: 12,
                      background: hubTone.bg,
                      color: hubTone.ink,
                      border: `1px solid ${hubTone.border}`,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <Kicker color={hubTone.inkSoft} size={9.5}>
                      Projet
                    </Kicker>
                    <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                      {repo.hubName}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: t.display,
                          fontWeight: Number(t.displayWeight),
                          fontSize: 30,
                          lineHeight: 1,
                        }}
                      >
                        {hubCount}
                      </span>
                      <Kicker color={hubTone.inkSoft} size={9.5}>
                        {fromRepo ? 'éléments' : repo.hubUnit}
                      </Kicker>
                    </span>
                  </button>

                  {map.mapDomains.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => openDomain(d.key)}
                      style={{
                        position: 'absolute',
                        left: d.left,
                        top: d.top,
                        width: d.w,
                        appearance: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderRadius: 11,
                        background: d.bg,
                        color: d.ink,
                        border: `1px solid ${d.border}`,
                        boxShadow: d.ring,
                        padding: '13px 15px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>
                          {d.name}
                        </span>
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            letterSpacing: '0.1em',
                            color: d.inkSoft,
                          }}
                        >
                          {d.num}
                        </span>
                      </span>
                      <span style={{ fontSize: 12, lineHeight: 1.4, color: d.inkSoft }}>
                        {d.role}
                      </span>
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          color: d.inkSoft,
                        }}
                      >
                        {d.count}
                      </span>
                    </button>
                  ))}

                  {map.mapLeaves.map((l) => (
                    <button
                      key={l.key}
                      onClick={() => openFeat(l.domainKey, l.name)}
                      style={{
                        position: 'absolute',
                        left: l.left,
                        top: l.top,
                        width: l.w,
                        height: l.h,
                        boxSizing: 'border-box',
                        appearance: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderRadius: 9,
                        background: l.bg,
                        color: l.ink,
                        border: `1px solid ${l.border}`,
                        padding: '0 13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: l.dot,
                          flex: 'none',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          lineHeight: 1.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {l.name}
                      </span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontFamily: MONO,
                          fontSize: 10,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: l.statusFg,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {l.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isList && domains.length > 0 && (
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
                  onClick={() => openDomain(d.key)}
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
        )}

        {inDomain && domain && (
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
                gridTemplateColumns: '250px minmax(0, 1fr) 100px',
                gap: 16,
                padding: '10px 16px',
                borderBottom: `1px solid ${t.line}`,
                fontFamily: MONO,
                fontSize: 9.5,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: t.inkFaint,
              }}
            >
              <span>{domain.features.some((f) => f.status) ? 'Fonctionnalité' : 'Élément'}</span>
              <span>{domain.features.some((f) => f.status) ? "Ce qu'elle fait" : 'Chemin'}</span>
              <span style={{ textAlign: 'right' }}>
                {domain.features.some((f) => f.status) ? 'Statut' : 'Poids'}
              </span>
            </div>
            {domain.features.map((f) => {
              const on = featName === f.name;
              const p = pill(f.status);
              return (
                <HoverButton
                  key={f.name}
                  onClick={() => navigate({ feat: f.name })}
                  hoverBackground={t.surfaceAlt}
                  style={{
                    appearance: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    background: on ? t.surfaceAlt : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${t.line}`,
                    padding: '12px 16px',
                    display: 'grid',
                    gridTemplateColumns: '250px minmax(0, 1fr) 100px',
                    gap: 16,
                    alignItems: 'baseline',
                    color: t.ink,
                  }}
                >
                  <span
                    style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: on ? t.tones[domain.tone].dot : t.inkFaint,
                      }}
                    >
                      {on ? '▸' : '·'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                      {f.name}
                    </span>
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5, color: t.inkSoft }}>
                    {f.what}
                  </span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 7px',
                      borderRadius: 999,
                      background: f.status ? p.bg : 'transparent',
                      color: f.status ? p.fg : t.inkSoft,
                      border: `1px solid ${f.status ? p.border : t.line}`,
                      textAlign: 'center',
                    }}
                  >
                    {badge(f)}
                  </span>
                </HoverButton>
              );
            })}
          </div>
        )}
      </div>

      <aside
        style={{
          borderLeft: `1px solid ${t.line}`,
          background: t.surfaceAlt,
          padding: '22px 22px 44px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          minHeight: '68vh',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Kicker color={t.inkFaint} size={9.5}>
            {panel.kicker}
          </Kicker>
          <span
            style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, color: panel.titleColor }}
          >
            {panel.title}
          </span>
          {panel.hasStatus && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: 9.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '5px 10px',
                borderRadius: 999,
                background: panel.pillBg,
                color: panel.pillFg,
                border: `1px solid ${panel.pillBorder}`,
                alignSelf: 'flex-start',
              }}
            >
              {panel.status}
            </span>
          )}
          <span style={{ fontSize: 13, lineHeight: 1.6, color: t.inkSoft }}>{panel.role}</span>
        </div>

        {panel.files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Kicker color={t.inkFaint} size={9.5}>
              {fromRepo ? 'Chemin dans le dépôt' : 'Implémentée par'}
            </Kicker>
            {panel.files.map((f) => (
              <span
                key={f}
                style={{
                  fontFamily: MONO,
                  fontSize: 11.5,
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: t.surface,
                  border: `1px solid ${t.line}`,
                  wordBreak: 'break-word',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {panel.notes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Kicker color={t.inkFaint} size={9.5}>
              {panel.notesLabel}
            </Kicker>
            {panel.notes.map((n) => (
              <div
                key={n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '8px minmax(0, 1fr)',
                  gap: 11,
                  alignItems: 'start',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 2,
                    background: t.accent,
                    marginTop: 7,
                  }}
                />
                <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>{n}</span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 'auto',
            borderTop: `1px solid ${t.line}`,
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          <Kicker color={t.inkFaint} size={9.5}>
            Règle d'or du repo
          </Kicker>
          <span style={{ fontSize: 12.5, lineHeight: 1.55, color: t.inkSoft }}>
            {repo.goldenRule}
          </span>
        </div>
      </aside>
    </section>
  );
}
