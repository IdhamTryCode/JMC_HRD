import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin")) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const rows = await db("activity_logs")
    .leftJoin("users", "activity_logs.user_id", "users.id")
    .whereNotNull("users.username")
    .distinct("users.username")
    .orderBy("users.username")
    .pluck("users.username");

  return NextResponse.json({ data: rows });
}
