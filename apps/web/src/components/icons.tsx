/**
 * Tiny inline SVG icon set. Used instead of unicode glyphs (arrows, ticks) so
 * affordances survive ASCII normalization and render identically everywhere.
 * Server- and client-safe (pure SVG, no hooks).
 */

interface IconProps {
  readonly className?: string | undefined;
  readonly size?: number;
}

export function ArrowRight({ className, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 8h9.5M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}

export function ArrowUpRight({ className, size = 12 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5 11 11 5M5.5 5H11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}

export function CheckTick({ className, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3.4 8.4l3 3 6.2-6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}
