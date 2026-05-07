import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [empStats] = await db("employees")
    .whereNull("deleted_at")
    .groupBy(db.raw("1"))
    .select(db.raw("COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active"))
    .catch(() => [{ total: "0", active: "0" }]);

  const [attStats] = await db("attendances")
    .whereRaw("EXTRACT(YEAR FROM date) = ?", [year])
    .whereRaw("EXTRACT(MONTH FROM date) = ?", [month])
    .select(
      db.raw("COUNT(*) as total"),
      db.raw("COUNT(*) FILTER (WHERE kehadiran = 'hadir') as hadir"),
      db.raw("COUNT(*) FILTER (WHERE kehadiran = 'cuti') as cuti"),
      db.raw("COUNT(*) FILTER (WHERE kehadiran = 'izin') as izin"),
      db.raw("COUNT(*) FILTER (WHERE verifikasi = 'pending') as pending_verif"),
      db.raw("COUNT(*) FILTER (WHERE late_minutes > 0) as terlambat")
    )
    .catch(() => [{ total: "0", hadir: "0", cuti: "0", izin: "0", pending_verif: "0", terlambat: "0" }]);

  const [transportStats] = await db("transport_allowances")
    .where({ period_year: year, period_month: month })
    .select(
      db.raw("COUNT(*) as total_computed"),
      db.raw("SUM(amount) as total_amount"),
      db.raw("COUNT(*) FILTER (WHERE eligible) as eligible_count")
    )
    .catch(() => [{ total_computed: "0", total_amount: "0", eligible_count: "0" }]);

  // Daily attendance trend (last 30 days)
  const dailyTrend = await db("attendances")
    .whereRaw("date >= CURRENT_DATE - INTERVAL '30 days'")
    .where("kehadiran", "hadir")
    .groupByRaw("date")
    .orderBy("date")
    .select(db.raw("date::text as date"))
    .count<{ date: string; count: string }[]>("id as count")
    .catch(() => []);

  // Employment type distribution
  const empTypeBreakdown = await db("employees")
    .whereNull("deleted_at")
    .where("is_active", true)
    .groupBy("employment_type")
    .select("employment_type")
    .count<{ employment_type: string; count: string }[]>("id as count")
    .catch(() => []);

  // Gender distribution
  const genderBreakdown = await db("employees")
    .whereNull("deleted_at")
    .where("is_active", true)
    .groupBy("gender")
    .select("gender")
    .count<{ gender: string; count: string }[]>("id as count")
    .catch(() => []);

  // 5 pegawai terbaru
  const newestEmployees = await db("employees")
    .leftJoin("positions", "employees.position_id", "positions.id")
    .leftJoin("departments", "employees.department_id", "departments.id")
    .whereNull("employees.deleted_at")
    .orderBy("employees.created_at", "desc")
    .limit(5)
    .select(
      "employees.id",
      "employees.full_name",
      "employees.nip",
      "employees.employment_type",
      "employees.join_date",
      "positions.name as position_name",
      "departments.name as department_name"
    )
    .catch(() => []);

  return NextResponse.json({
    employees: {
      total: Number(empStats?.total ?? 0),
      active: Number(empStats?.active ?? 0),
    },
    attendance: {
      total: Number(attStats?.total ?? 0),
      hadir: Number(attStats?.hadir ?? 0),
      cuti: Number(attStats?.cuti ?? 0),
      izin: Number(attStats?.izin ?? 0),
      pendingVerif: Number(attStats?.pending_verif ?? 0),
      terlambat: Number(attStats?.terlambat ?? 0),
    },
    transport: {
      totalComputed: Number(transportStats?.total_computed ?? 0),
      totalAmount: Number(transportStats?.total_amount ?? 0),
      eligibleCount: Number(transportStats?.eligible_count ?? 0),
    },
    dailyTrend: dailyTrend.map((r) => ({ date: r.date, count: Number(r.count) })),
    empTypeBreakdown: empTypeBreakdown.map((r) => ({
      type: r.employment_type,
      count: Number(r.count),
    })),
    genderBreakdown: genderBreakdown.map((r) => ({
      gender: r.gender,
      count: Number(r.count),
    })),
    newestEmployees,
    period: { year, month },
  });
}
