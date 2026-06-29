"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./preflight-verifier.module.css";

/**
 * PreflightVerifier
 * =================
 * A self-contained, looping hero illustration that tells the Celo Agent
 * Preflight story wordlessly in ~5-6s, then loops:
 *
 *   raw agent IN  ->  scanned  ->  four pillars verified  ->  scored  ->  attested
 *
 * A descending scan-line sweeps the card. As the line CROSSES each pillar
 * region that row decodes from opaque hex/JSON glyphs into a clean, labelled,
 * verified row (cause -> effect is derived from a single clock, so the line
 * literally drives the reveal). One pillar settles WARN (amber) to prove the
 * states are real; the headline result stays positive. A readiness score
 * counts up to 97 (READY) as the editorial climax, then a report hash gets an
 * "attested on Celo" stamp. Holds ~1.5s and loops.
 *
 * Engineering contract:
 *  - "use client", named export, ZERO required props (sensible demo defaults).
 *  - Decorative: role="img" + descriptive aria-label; inner content aria-hidden,
 *    user-select:none, pointer-events:none.
 *  - Animates ONLY transform / opacity (+ GPU-composited blur on the decode
 *    cross-fade). No width/height/top/left/margin/padding is ever animated.
 *  - Score count-up uses font-variant-numeric: tabular-nums in a fixed-width
 *    box => ZERO layout shift across 0 -> 9 -> 10 -> 97.
 *  - One rAF clock drives every continuous value (scan + count-up). It is GATED:
 *    it stops committing React state during the static hold, so there are NO
 *    per-frame re-renders while nothing is moving.
 *  - IntersectionObserver pauses/cancels the loop when the card is offscreen.
 *  - prefers-reduced-motion (CSS @media AND a reactive JS matchMedia path with
 *    a change listener + Safari fallback) renders the FINAL resolved state
 *    immediately, with no motion and no infinite animations.
 *  - All timers / rAF / observers are cleared on unmount and on IO stop.
 */

type Status = "pass" | "warn";

interface Pillar {
  readonly key: string;
  /** Uppercase pillar label, e.g. IDENTITY. */
  readonly label: string;
  /** Short category shown after the label, e.g. erc8004. */
  readonly category: string;
  /** Resolved one-line claim (reads as DONE). */
  readonly title: string;
  /** Single concise evidence line shown once resolved. */
  readonly evidence: string;
  /** Final settled status (headline demo positive; one WARN proves states). */
  readonly status: Status;
  /** Opaque glyphs shown BEFORE this region is decoded. */
  readonly raw: string;
}

const PILLARS: readonly Pillar[] = [
  {
    key: "identity",
    label: "Identity",
    category: "erc8004",
    title: "ERC-8004 registry record resolves",
    evidence: "agent #1 · owner 0x9f..2a · metadata OK",
    status: "pass",
    raw: '0x7f3a9c84d2..e91c {"name":"¤❖§'
  },
  {
    key: "endpoint",
    label: "Endpoint",
    category: "mcp / a2a",
    title: "MCP endpoint responds",
    evidence: "HTTP 200 · 84ms · A2A declared",
    status: "pass",
    raw: "https://agent.example/.well-known/▒▒▒"
  },
  {
    key: "payment",
    label: "Payment",
    category: "x402",
    title: "x402 returns Celo payment requirements",
    evidence: "HTTP 402 · network Celo · asset USDC",
    status: "warn",
    raw: "402?▒ accepts=¿¿ network=▒▒▒▒"
  },
  {
    key: "onchain",
    label: "Onchain",
    category: "celo · self",
    title: "Celo identity captured · Self Agent ID",
    evidence: "1,204 txns · Self proof-of-personhood",
    status: "pass",
    raw: "ipfs://▒▒▒▒ txns=¿,¿¿¿ self=▒"
  }
];

const COMMAND = "npx agentproof check --chain celo --registry erc8004 --agent-id 1";
const FINAL_SCORE = 97;
const SCORE_TAG = "ready"; // >=90 => ready / green
const REPORT_HASH = "0x9c1d..af20"; // shortened display form (0x + short hex)

/**
 * Timeline (ms from loop start). One rAF clock; all view-state is derived.
 * Total loop ~6.9s (sequence ~5.4s + ~1.5s hold).
 */
const T = {
  intake: 200, // raw target row appears
  typeStart: 360, // command begins typing
  typePerChar: 14, // ~1.0s to type the full command
  scanStart: 1500, // scan-line begins its sweep
  scanEnd: 4000, // scan-line finishes (~2.5s sweep, crossing all rows)
  scoreStart: 4180,
  scoreEnd: 5080, // count-up duration ~900ms
  attest: 5380,
  holdStart: 5700, // beyond here nothing moves until loop wrap
  loopLength: 7200
} as const;

const TYPE_END = T.typeStart + COMMAND.length * T.typePerChar;

/**
 * Vertical centre of each pillar row as a fraction (0..1) of the scan field.
 * The scan-line drives the reveal: a row resolves the instant the line crosses
 * its centre. Four evenly-stacked rows => centres at 1/8, 3/8, 5/8, 7/8.
 */
function rowCentreFraction(index: number): number {
  return (2 * index + 1) / (2 * PILLARS.length);
}

type RowState = "raw" | "spinning" | "settled";

function easeOutCubic(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - Math.pow(1 - c, 3);
}

export function PreflightVerifier() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const visibleRef = useRef<boolean>(true);

  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  // Elapsed ms within the current loop. -1 means "render final resolved state".
  const [elapsed, setElapsed] = useState<number>(0);

  // Reactive reduced-motion preference (with Safari add/removeListener fallback).
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    // Safari < 14 fallback.
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  // The animation clock. Skipped entirely under reduced motion or offscreen.
  useEffect(() => {
    if (reducedMotion) {
      setElapsed(-1);
      return;
    }

    const node = rootRef.current;
    if (!node) {
      return;
    }

    // Gate React commits: only update state while something is actually
    // animating (scan + count-up). During the static hold we idle the clock
    // (no setState), then reset cleanly on the next loop. This keeps CPU/render
    // cost near zero between beats.
    const tick = (now: number) => {
      if (startRef.current === 0) {
        startRef.current = now;
      }
      const e = (now - startRef.current) % T.loopLength;
      // Commit only inside the moving window; once held, pin the resolved frame
      // a single time and stop committing until the loop wraps.
      if (e < T.holdStart) {
        setElapsed(e);
      } else {
        setElapsed(T.holdStart);
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const startClock = () => {
      if (rafRef.current !== null) {
        return;
      }
      startRef.current = 0;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const stopClock = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      visibleRef.current = true;
      startClock();
      return () => stopClock();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry?.isIntersecting ?? false;
        visibleRef.current = isVisible;
        if (isVisible) {
          startClock();
        } else {
          stopClock();
        }
      },
      { threshold: 0.18 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      stopClock();
    };
  }, [reducedMotion]);

  const resolved = reducedMotion || elapsed < 0;

  // ----- Derive view-state from the single clock -----

  // Command typing (intake "raw in / check running" framing).
  const typedChars = resolved
    ? COMMAND.length
    : elapsed <= T.typeStart
      ? 0
      : Math.min(COMMAND.length, Math.floor((elapsed - T.typeStart) / T.typePerChar));
  const typing = !resolved && elapsed > T.typeStart && elapsed < TYPE_END;

  const intakeIn = resolved || elapsed >= T.intake;

  // Scan-line progress 0..1 down the scan field.
  let scanProgress = 0;
  let scanActive = false;
  if (!resolved) {
    if (elapsed >= T.scanStart && elapsed <= T.scanEnd) {
      scanActive = true;
      scanProgress = (elapsed - T.scanStart) / (T.scanEnd - T.scanStart);
    } else if (elapsed > T.scanEnd) {
      scanProgress = 1;
    }
  } else {
    scanProgress = 1;
  }

  // Row state is DERIVED from the scan-line position: a row begins resolving the
  // moment the line reaches its centre, shows a brief spinner, then settles.
  // This locks cause (scan crossing) to effect (row reveal).
  const rowState = (index: number): RowState => {
    if (resolved) {
      return "settled";
    }
    const centre = rowCentreFraction(index);
    // A small spin band just past the crossing point before the row settles.
    const spinBand = 0.06;
    if (scanProgress < centre) {
      return "raw";
    }
    if (scanProgress < centre + spinBand) {
      return "spinning";
    }
    return "settled";
  };

  // Score count-up (0 -> 97), cubic ease-out.
  let scoreValue = 0;
  let scoreFill = 0;
  if (resolved || elapsed >= T.scoreEnd) {
    scoreValue = FINAL_SCORE;
    scoreFill = 1;
  } else if (elapsed > T.scoreStart) {
    const eased = easeOutCubic((elapsed - T.scoreStart) / (T.scoreEnd - T.scoreStart));
    scoreValue = Math.round(eased * FINAL_SCORE);
    scoreFill = eased;
  }
  const scoreSettled = resolved || elapsed >= T.scoreEnd;

  const attestIn = resolved || elapsed >= T.attest;
  const intakeDecoded = resolved || rowState(0) !== "raw";

  const ariaLabel =
    "Illustration: a raw, unverified Celo agent target is scanned and decoded " +
    "into four verified checks (identity, endpoint, payment, onchain), scored " +
    "97 out of 100 — ready — and attested on Celo.";

  return (
    <div
      ref={rootRef}
      className={styles.card}
      role="img"
      aria-label={ariaLabel}
      data-resolved={resolved ? "true" : "false"}
    >
      <div className={styles.inner} aria-hidden="true">
        {/* Header: brand + muted chain badge */}
        <div className={styles.header}>
          <span className={styles.brand}>celo agent preflight</span>
          <span className={styles.chain}>chain 42220</span>
        </div>

        {/* Command line — types in with a blinking caret (live check starting) */}
        <div className={styles.command}>
          <span className={styles.prompt}>$</span>
          <code className={styles.cmd}>
            {COMMAND.slice(0, typedChars)}
            <span
              className={styles.caret}
              data-on={typing ? "true" : "false"}
            />
          </code>
        </div>

        {/* Scan body: intake target + four resolving rows + the scan-line */}
        <div className={styles.body}>
          {/* Intake target — raw glyphs cross-fade to a DONE summary */}
          <div
            className={styles.intake}
            data-in={intakeIn ? "true" : "false"}
            data-decoded={intakeDecoded ? "true" : "false"}
          >
            <span className={styles.intakeRaw}>
              0x7f3a9c84d2..e91c · ipfs://Qm▒▒ · {'{"name":"¤❖"}'}
            </span>
            <span className={styles.intakeClean}>
              target 0x7f3a..e91c · agent.json verified
            </span>
          </div>

          {/* Scan-line overlay (transform-driven; GPU only). Sweeps the rows. */}
          <div className={styles.scanLayer} data-active={scanActive ? "true" : "false"}>
            <div
              className={styles.scanGlow}
              style={{ transform: `translate3d(0, ${scanProgress * 100}%, 0)` }}
            />
            <div
              className={styles.scanLine}
              style={{ transform: `translate3d(0, ${scanProgress * 100}%, 0)` }}
            />
          </div>

          {/* The four pillar rows */}
          <ul className={styles.rows}>
            {PILLARS.map((pillar, index) => {
              const state = rowState(index);
              return (
                <li
                  key={pillar.key}
                  className={styles.row}
                  data-state={state}
                  data-status={pillar.status}
                >
                  {/* Left accent rail (scaleY resolve cue) */}
                  <span className={styles.rail} aria-hidden="true" />

                  {/* Status marker: dot -> spinner -> SVG tick / warn */}
                  <span className={styles.marker} aria-hidden="true">
                    <span className={styles.markerDot} />
                    <span className={styles.markerSpin} />
                    <svg className={styles.markerTick} viewBox="0 0 16 16" fill="none">
                      {pillar.status === "warn" ? (
                        <path
                          d="M8 3.4v5.4M8 11.3v.3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="square"
                        />
                      ) : (
                        <path
                          d="M3.4 8.4l3 3 6.2-6.8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                        />
                      )}
                    </svg>
                  </span>

                  <div className={styles.rowMain}>
                    <span className={styles.rowLabel}>
                      {pillar.label} · {pillar.category}
                    </span>
                    {/* Decode-reveal: raw glyphs cross-fade to the clean title
                        inside one fixed-height cell (no reflow). */}
                    <span className={styles.rowTitleWrap}>
                      <span className={styles.rowRaw}>{pillar.raw}</span>
                      <span className={styles.rowTitle}>{pillar.title}</span>
                    </span>
                    {/* Single concise evidence line — communicates once. */}
                    <span className={styles.rowEvidence}>{pillar.evidence}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Score panel — the editorial climax: big serif count-up + bar */}
        <div className={styles.score} data-settled={scoreSettled ? "true" : "false"}>
          <div className={styles.scoreHead}>
            <span className={styles.scoreCaption}>readiness score</span>
            <span className={styles.scoreTag}>{SCORE_TAG}</span>
          </div>
          <div className={styles.scoreMain}>
            <span className={styles.scoreNumberBox}>
              <span className={styles.scoreNumber}>{scoreValue}</span>
              <span className={styles.scoreDenom}>/100</span>
            </span>
          </div>
          <div className={styles.scoreBarTrack}>
            <div
              className={styles.scoreBarFill}
              style={{ transform: `scaleX(${scoreFill})` }}
            />
          </div>
        </div>

        {/* Attestation finale — report hash + attested stamp land */}
        <div className={styles.attest} data-in={attestIn ? "true" : "false"}>
          <span className={styles.attestLabel}>report hash</span>
          <code className={styles.attestHash}>{REPORT_HASH}</code>
          <span className={styles.attestStamp}>
            <svg viewBox="0 0 16 16" fill="none" className={styles.attestTick}>
              <path
                d="M3.4 8.4l3 3 6.2-6.8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            </svg>
            attested on Celo
          </span>
        </div>
      </div>
    </div>
  );
}

export default PreflightVerifier;
