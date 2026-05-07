import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const id = Number(params.id);
  const row = await db("attendances")
    .join("employees", "attendances.employee_id", "employees.id")
    .where("attendances.id", id)
    .select("attendances.*", "employees.full_name", "employees.nip")
    .first();

  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

const updateSchema = z.object({
  checkInAt: z.string().datetime({ offset: true }).nullable().optional(),
  checkOutAt: z.string().datetime({ offset: true }).nullable().optional(),
  kehadiran: z.enum(["hadir", "cuti", "izin", "unpaid_leave"]).optional(),
  durationHours: z.number().min(0).max(24).optional(),
  lateMinutes: z.number().int().min(0).optional(),
  isHalfday: z.boolean().optional(),
  keterangan: z.string().max(1000).nullable().optional(),
  // verification fields
  verifikasi: z.enum(["pending", "disetujui", "ditolak"]).optional(),
  verifikator: z.enum(["lead", "manager", "hrd"]).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const id = Number(params.id);
  const existing = await db("attendances").where({ id }).first();
  if (!existing) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const updates: Record<string, unknown> = { updated_at: new Date() };

  if (d.checkInAt !== undefined) updates.check_in_at = d.checkInAt;
  if (d.checkOutAt !== undefined) updates.check_out_at = d.checkOutAt;
  if (d.kehadiran !== undefined) updates.kehadiran = d.kehadiran;
  if (d.lateMinutes !== undefined) updates.late_minutes = d.lateMinutes;
  if (d.isHalfday !== undefined) updates.is_halfday = d.isHalfday;
  if (d.keterangan !== undefined) updates.keterangan = d.keterangan;
  if (d.verifikasi !== undefined) updates.verifikasi = d.verifikasi;
  if (d.verifikator !== undefined) updates.verifikator = d.verifikator;

  if (d.durationHours !== undefined) {
    updates.duration_hours = d.durationHours;
    updates.status = d.durationHours >= 8 ? "terpenuhi" : "tidak_terpenuhi";
  }

  await db("attendances").where({ id }).update(updates);

  await logActivity({
    userId: user.userId,
    action: "UPDATE_ATTENDANCE",
    module: "attendances",
    description: `Update presensi id=${id}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ message: "Presensi berhasil diupdate" });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const id = Number(params.id);
  const existing = await db("attendances").where({ id }).first();
  if (!existing) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  await db("attendances").where({ id }).delete();

  await logActivity({
    userId: user.userId,
    action: "DELETE_ATTENDANCE",
    module: "attendances",
    description: `Hapus presensi id=${id}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ message: "Presensi berhasil dihapus" });
}
