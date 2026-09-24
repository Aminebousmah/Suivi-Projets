import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Theme } from '../data/types';

export const MONO = "'JetBrains Mono', monospace";

interface HoverButtonProps {
  onClick: () => void;
  style: CSSProperties;
  hoverBackground: string;
  children: ReactNode;
}

/** Bouton de ligne avec un fond au survol — l'équivalent du style-hover de la maquette. */
export function HoverButton({ onClick, style, hoverBackground, children }: HoverButtonProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={hover ? { ...style, background: hoverBackground } : style}
    >
      {children}
    </button>
  );
}

interface KickerProps {
  color: string;
  children: ReactNode;
  size?: number;
}

/** Sur-titre mono en petites capitales espacées. */
export function Kicker({ color, children, size = 10 }: KickerProps) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: size,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </span>
  );
}

interface EmptyNoteProps {
  t: Theme;
  title?: string;
  children: ReactNode;
}

/**
 * Ce qui tient lieu d'un bloc vide : une absence est une information, elle se
 * dit, avec ce qu'il faut faire pour la combler.
 */
export function EmptyNote({ t, title, children }: EmptyNoteProps) {
  return (
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
      {title && <Kicker color={t.inkFaint}>{title}</Kicker>}
      <span style={{ fontSize: 13, lineHeight: 1.6, color: t.inkSoft }}>{children}</span>
    </div>
  );
}
