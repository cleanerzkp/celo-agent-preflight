import { ImageResponse } from "next/og";

import { SITE, shortHash } from "../../../src/site";
import { getReportByHash } from "../../../src/data/reports";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} report`;

const BG = "#050806";
const INK = "#f3f8ed";
const GREEN = "#35d07f";
const AMBER = "#e2aa45";
const RED = "#f16f5f";
const MUTED = "#98aa9b";

function labelColor(label: string): string {
  if (label === "ready") return GREEN;
  if (label === "ready_with_warnings") return AMBER;
  if (label === "not_ready") return RED;
  return MUTED;
}

export default async function ReportOpengraphImage({
  params
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const report = getReportByHash(hash);

  const score = report ? report.score.value : null;
  const label = report ? report.score.label.replaceAll("_", " ") : "not found";
  const accent = report ? labelColor(report.score.label) : MUTED;
  const checks = report ? report.checks.length : 0;
  const attested = Boolean(report?.attestation?.txHash);

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
          backgroundImage: `linear-gradient(135deg, ${hexToRgba(accent, 0.16)}, rgba(5,8,6,0) 46%)`,
          padding: "72px 80px",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              background: "#07100b",
              border: `2px solid ${GREEN}`
            }}
          >
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <path d="M3.4 8.4l3 3 6.2-6.8" stroke={GREEN} strokeWidth="2.2" />
            </svg>
          </div>
          <div style={{ display: "flex", color: INK, fontSize: 28, fontWeight: 600 }}>{SITE.name}</div>
          <div style={{ display: "flex", marginLeft: "auto", color: MUTED, fontSize: 22, letterSpacing: 1 }}>
            PREFLIGHT REPORT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", color: MUTED, fontSize: 26, letterSpacing: 2, textTransform: "uppercase" }}>
            Readiness score
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div style={{ display: "flex", color: INK, fontSize: 200, fontWeight: 700, lineHeight: 0.9 }}>
              {score === null ? "--" : score}
            </div>
            <div style={{ display: "flex", color: MUTED, fontSize: 48, fontWeight: 600 }}>/ 100</div>
            <div
              style={{
                display: "flex",
                marginLeft: 16,
                color: "#041209",
                background: accent,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                padding: "10px 20px"
              }}
            >
              {label}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, color: MUTED, fontSize: 24 }}>
          <div style={{ display: "flex" }}>{checks} checks</div>
          <div style={{ display: "flex" }}>/</div>
          <div style={{ display: "flex", fontFamily: "monospace" }}>{shortHash(hash, 10, 8)}</div>
          {attested ? (
            <>
              <div style={{ display: "flex" }}>/</div>
              <div style={{ display: "flex", color: GREEN }}>attested on Celo</div>
            </>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
