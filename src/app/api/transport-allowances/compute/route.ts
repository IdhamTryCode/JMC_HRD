import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

const computeSchema = z.object({
  periodYear: z.number().int().min(2020).max(2099),
  periodMonth: z.number().int().min(1).max(12),
});

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin", "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = computeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const { periodYear, periodMonth } = parsed.data;

  // Get latest transport setting
  const setting = await db("transport_settings")
    .where("effective_from", "<=", `${periodYear}-${String(periodMonth).padStart(2, "0")}-01`)
    .orderBy("effective_from", "desc")
    .first();

  if (!setting) {
    return NextResponse.json({ error: "Transport setting belum dikonfigurasi" }, { status: 422 });
  }

  const baseFare = Number(setting.base_fare_per_km);

  // Count working days for this period (attendances with kehadiran=hadir)
  // and compute per employee using compute_transport_allowance stored function
  // Hanya pegawai tetap yang eligible tunjangan transport (sesuai spec)
  const employees = await db("employees")
    .whereNull("deleted_at")
    .where("is_active", true)
    .where("employment_type", "tetap")
    .whereNotNull("latitude")
    .whereNotNull("longitude")
    .select("id", "full_name", "nip", "latitude", "longitude");

  // Get office location (use first office as reference)
  const office = await db("offices").first();
  if (!office) {
    return NextResponse.json({ error: "Data kantor belum dikonfigurasi" }, { status: 422 });
  }

  const officeLat = Number(office.latitude);
  const officeLon = Number(office.longitude);

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  let computed = 0;
  let skipped = 0;

  for (const emp of employees) {
    const distanceKmRaw = haversineKm(
      Number(emp.latitude),
      Number(emp.longitude),
      officeLat,
      officeLon
    );

    // Count working days: attendances with kehadiran=hadir in this period
    const [{ count: workingDaysCount }] = await db("attendances")
      .where({ employee_id: emp.id, kehadiran: "hadir" })
      .whereRaw("EXTRACT(YEAR FROM date) = ?", [periodYear])
      .whereRaw("EXTRACT(MONTH FROM date) = ?", [periodMonth])
      .count<{ count: string }[]>("id as count");

    const workingDays = Number(workingDaysCount);

    // Use stored function for calculation
    const [{ amount }] = await db.raw<{ rows: { amount: string }[] }>(
      `SELECT compute_transport_allowance(?, ?, ?) as amount`,
      [baseFare, distanceKmRaw, workingDays]
    ).then((r) => r.rows);

    const eligible = Number(amount) > 0;
    const distanceKmUsed = Math.round(Math.min(distanceKmRaw, 25));

    let reason: string | null = null;
    if (distanceKmRaw <= 5) reason = "Jarak ≤5 km, tidak eligible";
    else if (workingDays < 19) reason = `Hari masuk ${workingDays} < 19, tidak eligible`;

    await db("transport_allowances")
      .insert({
        employee_id: emp.id,
        period_year: periodYear,
        period_month: periodMonth,
        distance_km_raw: distanceKmRaw.toFixed(2),
        distance_km_used: distanceKmUsed,
        working_days: workingDays,
        base_fare: baseFare,
        amount: Number(amount).toFixed(2),
        eligible,
        reason,
        computed_at: new Date(),
      })
      .onConflict(["employee_id", "period_year", "period_month"])
      .merge(["distance_km_raw", "distance_km_used", "working_days", "base_fare", "amount", "eligible", "reason", "computed_at"]);

    computed++;
  }

  skipped = employees.length - computed;

  await logActivity({
    userId: user.userId,
    action: "COMPUTE_TRANSPORT",
    module: "transport-allowances",
    description: `Hitung tunjangan transport: ${periodYear}-${String(periodMonth).padStart(2, "0")}, ${computed} pegawai`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({
    message: `Berhasil menghitung tunjangan transport`,
    computed,
    skipped,
    periodYear,
    periodMonth,
  });
}
