import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { revokeAllUserSessions } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

// GET /api/users/:id — superadmin bisa lihat semua, selainnya hanya diri sendiri
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin", "manager_hrd", "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const id = Number(params.id);
  if (!requireRole(user, "superadmin") && id !== user.userId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const row = await db("users")
    .join("roles", "users.role_id", "roles.id")
    .leftJoin("employees", "users.employee_id", "employees.id")
    .where("users.id", id)
    .whereNull("users.deleted_at")
    .select(
      "users.id", "users.username", "users.email", "users.is_active",
      "users.last_login_at", "users.created_at",
      "roles.name as role", "roles.id as role_id",
      "employees.full_name as employee_name", "employees.id as employee_id"
    )
    .first();

  if (!row) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

const updateSchema = z.object({
  username: z.string().min(6).max(50).regex(/^[a-z0-9]+$/).optional(),
  role: z.enum(["superadmin", "manager_hrd", "admin_hrd"]).optional(),
  email: z.string().email().nullable().optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/users/:id — superadmin bisa update semua, selainnya hanya diri sendiri (username & email)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await requireAuth(req);
  if (!authUser) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(authUser, "superadmin", "manager_hrd", "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const id = Number(params.id);
  // Non-superadmin hanya bisa update dirinya sendiri
  if (!requireRole(authUser, "superadmin") && id !== authUser.userId) {
    return NextResponse.json({ error: "Akses ditolak. Anda hanya bisa mengubah profil sendiri." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const target = await db("users").where({ id }).whereNull("deleted_at").first();
  if (!target) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date() };

  if (parsed.data.username !== undefined) {
    const dup = await db("users")
      .where("username", parsed.data.username)
      .whereNot("id", id)
      .whereNull("deleted_at")
      .first();
    if (dup) return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    updates.username = parsed.data.username;
  }

  if (parsed.data.role !== undefined) {
    if (!requireRole(authUser, "superadmin")) {
      return NextResponse.json({ error: "Hanya superadmin yang bisa mengubah role" }, { status: 403 });
    }
    const roleRow = await db("roles").where({ name: parsed.data.role }).first();
    if (!roleRow) return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    updates.role_id = roleRow.id;
  }

  if (parsed.data.email !== undefined) updates.email = parsed.data.email;

  if (parsed.data.isActive !== undefined) {
    if (!requireRole(authUser, "superadmin")) {
      return NextResponse.json({ error: "Hanya superadmin yang bisa mengubah status aktif" }, { status: 403 });
    }
    updates.is_active = parsed.data.isActive;
    // force-logout kalau dinonaktifkan
    if (!parsed.data.isActive) {
      await revokeAllUserSessions(id);
    }
  }

  await db("users").where({ id }).update(updates);

  await logActivity({
    userId: authUser.userId,
    action: "UPDATE_USER",
    module: "users",
    description: `Update user id=${id}: ${JSON.stringify(parsed.data)}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ message: "User berhasil diupdate" });
}

// DELETE /api/users/:id — soft delete
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await requireAuth(req);
  if (!authUser) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(authUser, "superadmin")) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const id = Number(params.id);
  if (id === authUser.userId) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  const target = await db("users").where({ id }).whereNull("deleted_at").first();
  if (!target) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  await revokeAllUserSessions(id);
  await db("users").where({ id }).update({ deleted_at: new Date(), is_active: false });

  await logActivity({
    userId: authUser.userId,
    action: "DELETE_USER",
    module: "users",
    description: `Hapus user id=${id} (${target.username})`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ message: "User berhasil dihapus" });
}
