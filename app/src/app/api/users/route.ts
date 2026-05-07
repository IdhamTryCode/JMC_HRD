import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { sendPasswordEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// GET /api/users — list dengan paginasi + search (superadmin & manager_hrd saja)
export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin", "manager_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status"); // "active" | "inactive" | null

  const query = db("users")
    .join("roles", "users.role_id", "roles.id")
    .leftJoin("employees", "users.employee_id", "employees.id")
    .whereNull("users.deleted_at");

  // Semua role bisa lihat semua user; search & filter hanya superadmin
  if (requireRole(user, "superadmin")) {
    if (search) {
      query.where((q) =>
        q
          .whereILike("users.username", `%${search}%`)
          .orWhereILike("employees.full_name", `%${search}%`)
      );
    }
    if (status === "active") query.where("users.is_active", true);
    if (status === "inactive") query.where("users.is_active", false);
  }

  const [{ count }] = await query.clone().count<{ count: string }[]>("users.id as count");
  const total = Number(count);

  const rows = await query
    .select(
      "users.id",
      "users.username",
      "users.email",
      "users.is_active",
      "users.last_login_at",
      "users.created_at",
      "roles.name as role",
      "employees.full_name as employee_name",
      "employees.id as employee_id"
    )
    .orderBy("users.created_at", "desc")
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({ data: rows, total, page, limit });
}

// POST /api/users — buat user baru (hanya superadmin)
const createSchema = z.object({
  username: z.string().min(6).max(50).regex(/^[a-z0-9]+$/, "Hanya huruf kecil dan angka, tanpa spasi"),
  role: z.enum(["superadmin", "manager_hrd", "admin_hrd"]),
  employeeId: z.number().int().positive().optional(),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin")) {
    return NextResponse.json({ error: "Akses ditolak. Hanya superadmin yang dapat membuat user baru." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const { username, role, employeeId, email } = parsed.data;

  const exists = await db("users").where({ username }).whereNull("deleted_at").first();
  if (exists) return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });

  const roleRow = await db("roles").where({ name: role }).first();
  if (!roleRow) return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });

  // Generate password acak
  const plainPassword = crypto.randomBytes(8).toString("base64url").slice(0, 12);
  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash(plainPassword);

  // Tentukan email: dari field atau dari employee
  let resolvedEmail = email;
  if (!resolvedEmail && employeeId) {
    const emp = await db("employees").where({ id: employeeId }).first();
    resolvedEmail = emp?.email;
  }

  const [newUser] = await db("users")
    .insert({
      username,
      password_hash: passwordHash,
      role_id: roleRow.id,
      employee_id: employeeId ?? null,
      email: resolvedEmail ?? null,
      is_active: true,
    })
    .returning("id");

  if (resolvedEmail) {
    await sendPasswordEmail(resolvedEmail, username, plainPassword);
  }

  await logActivity({
    userId: user.userId,
    action: "CREATE_USER",
    module: "users",
    description: `Buat user: ${username} (role: ${role})`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ id: newUser.id, username, message: "User berhasil dibuat" }, { status: 201 });
}
