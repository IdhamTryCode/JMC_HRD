// Helpers untuk konversi snake_case (DB) ↔ camelCase (app layer).
// Pakai di service layer — jangan pakai langsung di API response tanpa validasi Zod.

export function toCamel<T = unknown>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const ck = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[ck] = v;
  }
  return out as T;
}

export function toSnake<T = unknown>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const sk = k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
    out[sk] = v;
  }
  return out as T;
}

export function toCamelArray<T = unknown>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => toCamel<T>(r));
}
