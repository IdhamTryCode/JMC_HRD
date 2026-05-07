import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const periodYear = Number(searchParams.get("periodYear") ?? new Date().getFullYear());
  const periodMonth = Number(searchParams.get("periodMonth") ?? new Date().getMonth() + 1);

  // Breakdown per kehadiran type for this period
  const breakdown = await db("attendances")
    .whereRaw("EXTRACT(YEAR FROM date) = ?", [periodYear])
    .whereRaw("EXTRACT(MONTH FROM date) = ?", [periodMonth])
    .groupBy("kehadiran")
    .select("kehadiran")
    .count<{ kehadiran: string; count: string }[]>("id as count");

  // Late stats
  const [lateStats] = await db("attendances")
    .whereRaw("EXTRACT(YEAR FROM date) = ?", [periodYear])
    .whereRaw("EXTRACT(MONTH FROM date) = ?", [periodMonth])
    .where("late_minutes", ">", 0)
    .count<{ count: string }[]>("id as count");

  // Verification pending
  const [pendingStats] = await db("attendances")
    .whereRaw("EXTRACT(YEAR FROM date) = ?", [periodYear])
    .whereRaw("EXTRACT(MONTH FROM date) = ?", [periodMonth])
    .where("verifikasi", "pending")
    .count<{ count: string }[]>("id as count");

  // Daily trend: count hadir per day
  const dailyTrend = await db("attendances")
    .whereRaw("EXTRACT(YEAR FROM date) = ?", [periodYear])
    .whereRaw("EXTRACT(MONTH FROM date) = ?", [periodMonth])
    .where("kehadiran", "hadir")
    .groupByRaw("date")
    .orderBy("date")
    .select(db.raw("date::text as date"))
    .count<{ date: string; count: string }[]>("id as count");

  return NextResponse.json({
    periodYear,
    periodMonth,
    breakdown: breakdown.map((r) => ({ kehadiran: r.kehadiran, count: Number(r.count) })),
    lateCount: Number(lateStats.count),
    pendingCount: Number(pendingStats.count),
    dailyTrend: dailyTrend.map((r) => ({ date: r.date, count: Number(r.count) })),
  });
}
