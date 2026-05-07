import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Minimal 8 karakter")
    .regex(/[A-Z]/, "Harus ada huruf kapital")
    .regex(/[0-9]/, "Harus ada angka")
    .regex(/[^A-Za-z0-9]/, "Harus ada karakter spesial"),
});

// PATCH /api/users/:id/password
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await requireAuth(req);
  if (!authUser) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const id = Number(params.id);
  // Hanya bisa ganti password sendiri (kecuali superadmin)
  if (authUser.userId !== id && authUser.role !== "superadmin") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const target = await db("users").where({ id }).whereNull("deleted_at").first();
  if (!target) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  const currentOk = await argon2.verify(target.password_hash, parsed.data.currentPassword);
  if (!currentOk) {
    return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
  }

  const newHash = await argon2.hash(parsed.data.newPassword);
  await db("users").where({ id }).update({ password_hash: newHash, updated_at: new Date() });

  await logActivity({
    userId: authUser.userId,
    action: "CHANGE_PASSWORD",
    module: "users",
    description: `Ganti password user id=${id}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ message: "Password berhasil diubah" });
}
