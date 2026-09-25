import { useEffect, useRef } from 'react';
import { EmptyNote, HoverButton, Kicker, MONO } from '../components/ui';
import { LABELS, ORDER } from '../data/labels';
import type { Domain, RepoData, Theme, TreeSource, VizMode } from '../data/types';
import { resolvedFor } from '../lib/coverage';
import { SourceBadge } from '../components/SourceBadge';
import type { RepoReader } from '../components/SourceBadge';
import type { RepoCheck } from '../lib/verify';
import { buildMap, buildOverview } from '../lib/graph';
import { HANDLED, nextSelection, nodeId } from '../lib/keyboard';
import { useNarrow, useStacked } from '../lib/useMediaQuery';
import type { PanelModel } from './arch/DetailPanel';
import { DetailPanel } from './arch/DetailPanel';
import { DomainCards } from './arch/DomainCards';
import { FeatureTable } from './arch/FeatureTable';
import { GraphCanvas } from './arch/GraphCanvas';
import type { AtlasState } from '../lib/url';
import { ZOOM_STEPS } from '../lib/url';

interface Props {
  t: Theme;
  repo: RepoData;
  viz: VizMode;
  src: TreeSource;
  /** Domaines déduits du dépôt, absents tant qu'il n'est pas connecté. */
  treeDomains: Domain[] | null;
  /** Confrontation des fichiers cités à l'arborescence, si le dépôt est lu. */
  check: RepoCheck | null;
  /** Vrai quand l'arbre décrit vient de l'atlas.md du dépôt. */
  fromAtlasFile: boolean;
  reader: RepoReader;
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
  check,
  fromAtlasFile,
  reader,
  domainKey,
  featName,
  zoom,
  navigate,
}: Props) {
  const narrow = useNarrow();
  const stacked = useStacked();
  // Sans arbre décrit — un dépôt ajouté sans atlas.md —, l'arborescence réelle
  // tient lieu d'arbre plutôt qu'une page vide.
  const noDescription = !repo.domains.length && !!treeDomains?.length;
  const fromRepo = src === 'repo' || noDescription;
  const shownSrc = fromRepo ? 'repo' : 'described';
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

  const canvas = useRef<HTMLDivElement>(null);
  /** Vrai tant que la dernière sélection vient du clavier : sinon, pas de vol de focus. */
  const fromKeyboard = useRef(false);

  // Le focus suit la sélection, et le nœud choisi est amené dans la vue.
  useEffect(() => {
    if (!fromKeyboard.current) return;
    fromKeyboard.current = false;
    const el = canvas.current?.querySelector<HTMLElement>(
      `[data-noeud="${CSS.escape(nodeId({ domain: domainKey, feat: featName }))}"]`,
    );
    el?.focus();
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [domainKey, featName]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!HANDLED.includes(e.key)) return;
    const next = nextSelection(domains, { domain: domainKey, feat: featName }, e.key);
    if (!next) return;
    e.preventDefault();
    fromKeyboard.current = true;
    navigate(next);
  };

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

  let panel: PanelModel;
  if (feat && domain) {
    const p = pill(feat.status);
    const resolved = resolvedFor(check, domain.key, feat.files);
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
      real: resolved,
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
      real: [],
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
      real: [],
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
        // La maquette partageait l'écran en deux moitiés égales : le graphe, cœur
        // de la vue, débordait alors de sa colonne dès le zoom par défaut. Le
        // panneau garde une largeur de lecture, l'arbre prend le reste.
        gridTemplateColumns: stacked ? '1fr' : 'minmax(0, 1fr) clamp(300px, 27vw, 400px)',
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
                  border: `1px solid ${m.id === shownSrc ? t.ink : t.line}`,
                  background: m.id === shownSrc ? t.ink : 'transparent',
                  color: m.id === shownSrc ? t.page : t.inkSoft,
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

        {(!fromRepo || noDescription || reader.error) && (
          <SourceBadge
            t={t}
            live={fromAtlasFile}
            what="Les domaines et leurs statuts"
            from="atlas.md"
            hint="Ce dépôt ne fournit pas d'atlas.md — ATLAS-PROMPT.md contient le prompt qui le produit."
            {...reader}
          />
        )}

        {fromRepo && domains.length === 0 && (
          <EmptyNote t={t} title="Arbre du dépôt">
            Cet arbre est construit depuis l'arborescence réelle : dossiers et fichiers, avec
            leur poids et ce que les derniers commits ont touché. Aucun statut n'y figure —
            rien dans une arborescence ne dit qu'une chose est en cours ou gelée. Connectez le
            dépôt depuis la vue « Dépôt réel » pour le voir.
          </EmptyNote>
        )}

        {!fromRepo && domains.length === 0 && (
          <EmptyNote t={t} title="Arbre décrit">
            Aucune fonctionnalité n'est encore décrite pour ce projet. Elles viendront de son
            atlas.md : lancez dans le projet le prompt de mise en place d'ATLAS-PROMPT.md,
            poussez le fichier, puis lisez le dépôt. En attendant, la source « dépôt » montre
            son arborescence réelle.
          </EmptyNote>
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
                      gridTemplateColumns: narrow
                        ? 'minmax(0, 1fr) 54px'
                        : 'minmax(0, 1fr) minmax(90px, 150px) 132px 34px',
                      gap: narrow ? 10 : 14,
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
                    {!narrow && (
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
                    )}
                    {!narrow && (
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
                    )}
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
            <GraphCanvas
              t={t}
              map={map}
              zoom={zoom}
              fromRepo={fromRepo}
              hubName={repo.hubName}
              hubUnit={fromRepo ? 'éléments' : repo.hubUnit}
              hubCount={hubCount}
              hubTone={hubTone}
              domainKey={domainKey}
              featName={featName}
              canvas={canvas}
              onKeyDown={onKeyDown}
              onReset={reset}
              onOpenDomain={openDomain}
              onOpenFeat={openFeat}
            />
          </div>
        )}

        {isList && domains.length > 0 && (
          <DomainCards t={t} domains={domains} onOpenDomain={openDomain} />
        )}

        {inDomain && domain && (
          <FeatureTable
            t={t}
            domain={domain}
            featName={featName}
            narrow={narrow}
            badge={badge}
            pill={pill}
            onOpenFeat={(name) => navigate({ feat: name })}
          />
        )}
      </div>

      <DetailPanel
        t={t}
        panel={panel}
        narrow={stacked}
        fromRepo={fromRepo}
        goldenRule={repo.goldenRule}
      />
    </section>
  );
}
