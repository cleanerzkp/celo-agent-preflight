import { ImageResponse } from "next/og";

import { SITE } from "../src/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} - ${SITE.tagline}`;

const BG = "#050806";
const INK = "#f3f8ed";
const GREEN = "#35d07f";
const MUTED = "#98aa9b";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          backgroundImage:
            "linear-gradient(135deg, rgba(53,208,127,0.16), rgba(5,8,6,0) 42%), linear-gradient(315deg, rgba(147,168,255,0.12), rgba(5,8,6,0) 46%)",
          padding: "72px 80px",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              background: "#07100b",
              border: `2px solid ${GREEN}`,
              color: GREEN,
              fontSize: 34,
              fontWeight: 700
            }}
          >
            <svg width="30" height="30" viewBox="0 0 16 16" fill="none">
              <path d="M3.4 8.4l3 3 6.2-6.8" stroke={GREEN} strokeWidth="2.2" />
            </svg>
          </div>
          <div style={{ display: "flex", color: INK, fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              color: INK,
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 920
            }}
          >
            Verify an AI agent&nbsp;<span style={{ color: GREEN }}>before</span>&nbsp;you trust it.
          </div>
          <div style={{ display: "flex", color: MUTED, fontSize: 28, lineHeight: 1.4, maxWidth: 880 }}>
            Deterministic, hash-verifiable readiness reports for ERC-8004 / x402 agents on Celo.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {["ERC-8004", "MCP / A2A", "x402", "Self", "Celo"].map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                color: MUTED,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
                padding: "10px 16px",
                border: "1px solid rgba(243,248,237,0.16)"
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
