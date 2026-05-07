import { describe, it, expect } from "vitest";

/**
 * Replika logic compute_transport_allowance (stored function di PostgreSQL)
 * untuk unit test tanpa DB connection.
 *
 * Rules:
 *   - jarak <= 5 km  → 0 (tidak eligible)
 *   - hari masuk < 19 → 0 (tidak eligible)
 *   - jarak di-clamp ke max 25 km
 *   - pembulatan: ROUND standar (>=0.5 ke atas)
 *   - hasil = base_fare * km_used * working_days
 */
function computeTransportAllowance(
  baseFare: number,
  distanceKm: number,
  workingDays: number
): number {
  if (distanceKm <= 5) return 0;
  if (workingDays < 19) return 0;
  const kmUsed = Math.round(Math.min(distanceKm, 25));
  return baseFare * kmUsed * workingDays;
}

describe("computeTransportAllowance", () => {
  const BASE = 5000;

  it("jarak <= 5 km → 0", () => {
    expect(computeTransportAllowance(BASE, 5, 22)).toBe(0);
    expect(computeTransportAllowance(BASE, 3, 22)).toBe(0);
    expect(computeTransportAllowance(BASE, 0, 22)).toBe(0);
  });

  it("jarak tepat > 5 km sudah eligible", () => {
    expect(computeTransportAllowance(BASE, 5.1, 22)).toBeGreaterThan(0);
  });

  it("hari masuk < 19 → 0", () => {
    expect(computeTransportAllowance(BASE, 10, 18)).toBe(0);
    expect(computeTransportAllowance(BASE, 10, 0)).toBe(0);
  });

  it("hari masuk tepat 19 sudah eligible", () => {
    expect(computeTransportAllowance(BASE, 10, 19)).toBeGreaterThan(0);
  });

  it("jarak di-clamp ke max 25 km", () => {
    const result30km = computeTransportAllowance(BASE, 30, 22);
    const result25km = computeTransportAllowance(BASE, 25, 22);
    expect(result30km).toBe(result25km);
  });

  it("pembulatan jarak >= 0.5 ke atas", () => {
    // 10.5 km → dibulatkan ke 11
    expect(computeTransportAllowance(BASE, 10.5, 22)).toBe(BASE * 11 * 22);
  });

  it("pembulatan jarak < 0.5 ke bawah", () => {
    // 10.4 km → dibulatkan ke 10
    expect(computeTransportAllowance(BASE, 10.4, 22)).toBe(BASE * 10 * 22);
  });

  it("kalkulasi normal: 10 km, 22 hari, tarif 5000", () => {
    expect(computeTransportAllowance(5000, 10, 22)).toBe(5000 * 10 * 22);
  });

  it("kalkulasi normal: 20 km, 20 hari, tarif 3000", () => {
    expect(computeTransportAllowance(3000, 20, 20)).toBe(3000 * 20 * 20);
  });

  it("jarak 25 km persis (no clamp needed)", () => {
    expect(computeTransportAllowance(5000, 25, 22)).toBe(5000 * 25 * 22);
  });
});
