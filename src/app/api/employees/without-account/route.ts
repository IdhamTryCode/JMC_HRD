import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/employees/without-account?search=xxx
// Kembalikan pegawai aktif yang belum memiliki akun user
export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin")) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search") ?? "";

  const query = db("employees")
    .whereNull("employees.deleted_at")
    .where("employees.is_active", true)
    .whereNotExists(
      db("users")
        .whereRaw("users.employee_id = employees.id")
        .whereNull("users.deleted_at")
    )
    .select("employees.id", "employees.full_name", "employees.nip", "employees.email", "employees.phone");

  if (search) {
    query.where((q) =>
      q
        .whereILike("employees.full_name", `%${search}%`)
        .orWhereILike("employees.nip", `%${search}%`)
    );
  }

  const rows = await query.orderBy("employees.full_name").limit(20);
  return NextResponse.json({ data: rows });
}
