import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = "/tmp/attendance-imports";
const QUEUE_NAME = "attendance-import";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const rows = await db("attendance_imports")
    .join("users", "attendance_imports.user_id", "users.id")
    .orderBy("attendance_imports.created_at", "desc")
    .limit(50)
    .select(
      "attendance_imports.id",
      "attendance_imports.period_year",
      "attendance_imports.period_month",
      "attendance_imports.status",
      "attendance_imports.total_rows",
      "attendance_imports.success_rows",
      "attendance_imports.failed_rows",
      "attendance_imports.created_at",
      "attendance_imports.finished_at",
      "users.username"
    );

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin", "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Form data tidak valid" }, { status: 400 });

  const file = formData.get("file") as File | null;
  const periodYear = Number(formData.get("periodYear"));
  const periodMonth = Number(formData.get("periodMonth"));

  if (!file || !periodYear || !periodMonth) {
    return NextResponse.json({ error: "File, periodYear, dan periodMonth wajib diisi" }, { status: 400 });
  }

  if (!file.name.endsWith(".xlsx")) {
    return NextResponse.json({ error: "Hanya file .xlsx yang diizinkan" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `import-${Date.now()}-${file.name}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const [importRow] = await db("attendance_imports")
    .insert({
      user_id: user.userId,
      file_path: filePath,
      period_year: periodYear,
      period_month: periodMonth,
      status: "queued",
    })
    .returning("id");

  // Queue BullMQ job
  const { Queue } = await import("bullmq");
  const { redis } = await import("@/lib/redis");
  const queue = new Queue(QUEUE_NAME, { connection: redis });
  await queue.add("process-import", { importId: importRow.id, filePath }, { attempts: 3 });

  await logActivity({
    userId: user.userId,
    action: "IMPORT_ATTENDANCE",
    module: "attendances",
    description: `Import presensi: ${periodYear}-${String(periodMonth).padStart(2, "0")} file=${file.name}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({
    id: importRow.id,
    message: "File berhasil diunggah dan sedang diproses",
  }, { status: 202 });
}
