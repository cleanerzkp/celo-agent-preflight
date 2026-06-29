"use client";

import { useState } from "react";

import { CheckTick, CopyIcon } from "./icons";
import styles from "./copy-button.module.css";

export function CopyButton({
  value,
  label = "value"
}: {
  readonly value: string;
  readonly label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context); fail quietly.
    }
  }

  return (
    <button
      type="button"
      className={styles.copy}
      onClick={onCopy}
      data-copied={copied ? "true" : "false"}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
    >
      <span className={styles.iconStack} aria-hidden="true">
        <span className={styles.copyIcon}>
          <CopyIcon size={13} />
        </span>
        <span className={styles.doneIcon}>
          <CheckTick size={13} />
        </span>
      </span>
    </button>
  );
}

export default CopyButton;
