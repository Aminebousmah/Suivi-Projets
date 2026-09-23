import type { KeyboardEvent, RefObject } from 'react';
import { Kicker, MONO } from '../../components/ui';
import type { Theme, Tone } from '../../data/types';
import type { GraphMapModel } from '../../lib/graph';
import { CANVAS_WIDTH } from '../../lib/graph';
import { nodeId } from '../../lib/keyboard';

interface Props {
  t: Theme;
  map: GraphMapModel;
  zoom: number;
  fromRepo: boolean;
  hubName: string;
  hubUnit: string;
  hubCount: number;
  hubTone: Tone;
  domainKey: string | null;
  featName: string | null;
  canvas: RefObject<HTMLDivElement | null>;
  onKeyDown: (e: KeyboardEvent) => void;
  onReset: () => void;
  onOpenDomain: (key: string) => void;
  onOpenFeat: (domainKey: string, name: string) => void;
}

/**
 * L'arbre dessiné d'un seul tenant : on y navigue au zoom, au défilement et au
 * clavier. Tout y est posé en absolu, aux coordonnées que `buildMap` a calculées
 * — ce composant ne fait que rendre ce qu'on lui donne.
 */
export function GraphCanvas({
  t,
  map,
  zoom,
  fromRepo,
  hubName,
  hubUnit,
  hubCount,
  hubTone,
  domainKey,
  featName,
  canvas,
  onKeyDown,
  onReset,
  onOpenDomain,
  onOpenFeat,
}: Props) {
  return (
      <div
        ref={canvas}
        onKeyDown={onKeyDown}
        role="tree"
        // Sans point d'entrée au clavier, l'arbre ne se pilote qu'après
        // avoir cliqué dedans : la tabulation doit pouvoir y mener.
        tabIndex={0}
        aria-label={`Arbre ${fromRepo ? 'du dépôt' : 'des fonctionnalités'} — flèches pour naviguer`}
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
              onClick={onReset}
              data-noeud={nodeId({ domain: null, feat: null })}
              aria-label={`Projet ${hubName}`}
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
                {hubName}
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
                  {fromRepo ? 'éléments' : hubUnit}
                </Kicker>
              </span>
            </button>

            {map.mapDomains.map((d) => (
              <button
                key={d.key}
                onClick={() => onOpenDomain(d.key)}
                data-noeud={nodeId({ domain: d.key, feat: null })}
                aria-expanded={domainKey === d.key}
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
                onClick={() => onOpenFeat(l.domainKey, l.name)}
                data-noeud={nodeId({ domain: l.domainKey, feat: l.name })}
                aria-current={featName === l.name}
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
  );
}
