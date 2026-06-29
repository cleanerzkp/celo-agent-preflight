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

export function CopyIcon({ className, size = 14 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect x="5.5" y="5.5" width="8" height="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1V9.5a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function Glyph({ className, size = 26, children }: IconProps & { readonly children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Identity (ERC-8004) - shield with a check. */
export function IdentityIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3 5 6v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Z" />
      <path d="m9 11.5 2 2 4-4.5" />
    </Glyph>
  );
}

/** Endpoint readiness (MCP / A2A) - broadcast / signal. */
export function EndpointIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.5 7.5a6 6 0 0 0 0 9M16.5 7.5a6 6 0 0 1 0 9" />
      <path d="M4.8 4.8a9.5 9.5 0 0 0 0 14.4M19.2 4.8a9.5 9.5 0 0 1 0 14.4" />
    </Glyph>
  );
}

/** Payment routes (x402) - coin with a route arrow. */
export function PaymentIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M9 6.5v5M7.3 8h2.4a1.25 1.25 0 0 1 0 2.5H7.3" />
      <path d="M13 17h5m0 0-2-2m2 2-2 2" />
    </Glyph>
  );
}

/** Onchain evidence (Celo + Self) - linked blocks. */
export function OnchainIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 2.5 19 6.5v8L12 18.5 5 14.5v-8L12 2.5Z" />
      <path d="M12 2.5v16M19 6.5 12 10.5 5 6.5" />
    </Glyph>
  );
}
