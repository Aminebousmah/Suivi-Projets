import { Kicker, MONO } from '../../components/ui';
import type { Theme } from '../../data/types';

export interface PanelModel {
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
  /** Ce que les chemins cités donnent réellement dans le dépôt. */
  real: string[];
  notesLabel: string;
  notes: string[];
}

interface Props {
  t: Theme;
  panel: PanelModel;
  narrow: boolean;
  fromRepo: boolean;
  goldenRule: string;
}

/** Le détail de ce qui est sélectionné : projet, domaine ou feuille. */
export function DetailPanel({ t, panel, narrow, fromRepo, goldenRule }: Props) {
  return (
      <aside
        style={{
          borderLeft: narrow ? 'none' : `1px solid ${t.line}`,
          borderTop: narrow ? `1px solid ${t.line}` : 'none',
          background: t.surfaceAlt,
          padding: narrow ? '20px clamp(18px, 3.5vw, 38px) 36px' : '22px 22px 44px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          minHeight: narrow ? 0 : '68vh',
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

        {panel.real.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Kicker color={t.inkFaint} size={9.5}>
              Dans le dépôt
            </Kicker>
            {panel.real.map((r) => (
              <span
                key={r}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  lineHeight: 1.45,
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: t.surface,
                  border: `1px solid ${r.startsWith('absent') ? t.warnBorder : t.line}`,
                  color: r.startsWith('absent') ? t.warnFg : t.inkSoft,
                  wordBreak: 'break-word',
                }}
              >
                {r}
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
            {goldenRule}
          </span>
        </div>
      </aside>
  );
}
