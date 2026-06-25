type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

export function canonicalJson(value: unknown): string {
  return JSON.stringify(toCanonicalValue(value));
}

function toCanonicalValue(value: unknown): CanonicalValue {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON does not support non-finite numbers.");
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toCanonicalValue(entry));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));

    return Object.fromEntries(
      entries.map(([key, entry]) => [key, toCanonicalValue(entry)])
    ) as CanonicalValue;
  }

  throw new TypeError(`Canonical JSON does not support ${typeof value}.`);
}
