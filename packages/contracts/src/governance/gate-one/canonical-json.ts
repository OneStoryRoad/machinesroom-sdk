import crypto from "node:crypto";

export type GateOneCanonicalJsonPrimitive = string | number | boolean | null;
export type GateOneCanonicalJsonValue =
  | GateOneCanonicalJsonPrimitive
  | GateOneCanonicalJsonValue[]
  | { [key: string]: GateOneCanonicalJsonValue };

export class GateOneCanonicalJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GateOneCanonicalJsonError";
  }
}

export function stableGateOneStringify(value: unknown): string {
  return stringifyCanonical(normalizeCanonicalValue(value, "$"));
}

export function gateOneSha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function gateOneSha256Digest(input: string): `sha256:${string}` {
  return `sha256:${gateOneSha256Hex(input)}`;
}

export function stableGateOneDigest(value: unknown): `sha256:${string}` {
  return gateOneSha256Digest(stableGateOneStringify(value));
}

function normalizeCanonicalValue(value: unknown, path: string): GateOneCanonicalJsonValue {
  if (value === null) return null;

  if (typeof value === "string") {
    return value.normalize("NFC").replace(/\r\n?/g, "\n");
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new GateOneCanonicalJsonError(`${path} must be a finite number`);
    }
    if (Object.is(value, -0)) return 0;
    return value;
  }

  if (typeof value === "boolean") return value;

  if (typeof value === "undefined") {
    throw new GateOneCanonicalJsonError(`${path} cannot be undefined`);
  }

  if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") {
    throw new GateOneCanonicalJsonError(`${path} has unsupported type ${typeof value}`);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeCanonicalValue(item, `${path}[${index}]`));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const output: Record<string, GateOneCanonicalJsonValue> = {};
    for (const key of Object.keys(record).sort(compareCanonicalKeys)) {
      const next = record[key];
      const normalizedKey = key.normalize("NFC");
      if (Object.prototype.hasOwnProperty.call(output, normalizedKey)) {
        throw new GateOneCanonicalJsonError(`${path} has duplicate key after NFC normalization: ${normalizedKey}`);
      }
      output[normalizedKey] = normalizeCanonicalValue(next, `${path}.${key}`);
    }
    return output;
  }

  throw new GateOneCanonicalJsonError(`${path} has unsupported value`);
}

function stringifyCanonical(value: GateOneCanonicalJsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyCanonical(item)).join(",")}]`;
  }
  const entries = Object.entries(value).sort(([left], [right]) => compareCanonicalKeys(left, right));
  return `{${entries.map(([key, next]) => `${JSON.stringify(key)}:${stringifyCanonical(next)}`).join(",")}}`;
}

function compareCanonicalKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
