import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

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
