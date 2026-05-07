import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const row = await db("attendance_imports")
    .where("id", Number(params.id))
    .first();

  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    status: row.status,
    total_rows: row.total_rows,
    success_rows: row.success_rows,
    failed_rows: row.failed_rows,
    error_log: row.error_log,
    finished_at: row.finished_at,
  });
}
