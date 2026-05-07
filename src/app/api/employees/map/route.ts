import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const rows = await db("employees")
    .leftJoin("positions", "employees.position_id", "positions.id")
    .leftJoin("departments", "employees.department_id", "departments.id")
    .whereNull("employees.deleted_at")
    .where("employees.is_active", true)
    .whereNotNull("employees.latitude")
    .whereNotNull("employees.longitude")
    .select(
      "employees.id",
      "employees.full_name",
      "employees.nip",
      "employees.latitude",
      "employees.longitude",
      "positions.name as position_name",
      "departments.name as department_name"
    );

  const officeLat = Number(process.env.OFFICE_DEFAULT_LAT ?? -7.797068);
  const officeLon = Number(process.env.OFFICE_DEFAULT_LNG ?? 110.370529);

  const withDistance = rows.map((r) => ({
    ...r,
    distance_km: parseFloat(haversineKm(Number(r.latitude), Number(r.longitude), officeLat, officeLon).toFixed(2)),
  }));

  const nearest = withDistance.length > 0
    ? withDistance.reduce((a, b) => (a.distance_km < b.distance_km ? a : b))
    : null;

  return NextResponse.json({ data: withDistance, nearest });
}
