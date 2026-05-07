import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const year = searchParams.get("year");
  const employeeId = searchParams.get("employeeId");
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  function buildBase() {
    const q = db("leave_quotas")
      .join("employees", "leave_quotas.employee_id", "employees.id")
      .join("positions", "employees.position_id", "positions.id")
      .join("departments", "employees.department_id", "departments.id")
      .whereNull("employees.deleted_at");

    if (year) q.where("leave_quotas.year", year);
    if (employeeId) q.where("leave_quotas.employee_id", employeeId);
    if (search) {
      q.where((w) =>
        w
          .whereILike("employees.full_name", `%${search}%`)
          .orWhereILike("employees.nip", `%${search}%`)
      );
    }
    return q;
  }

  const [{ count }] = await buildBase().count<{ count: string }[]>("leave_quotas.id as count");
  const total = Number(count);

  const rows = await buildBase()
    .select(
      "leave_quotas.*",
      "employees.nip",
      "employees.full_name",
      "positions.name as position_name",
      "departments.name as department_name"
    )
    .orderBy("employees.full_name", "asc")
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({ data: rows, total, page, limit });
}

const schema = z.object({
  employeeId: z.number().int().positive(),
  year: z.number().int().min(2020).max(2099),
  cutiQuota: z.number().min(0).max(30).optional(),
  izinQuota: z.number().min(0).max(30).optional(),
  unpaidLeaveQuota: z.number().min(0).max(30).optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin", "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;

  await db("leave_quotas")
    .insert({
      employee_id: d.employeeId,
      year: d.year,
      cuti_quota: d.cutiQuota ?? 12,
      izin_quota: d.izinQuota ?? 12,
      unpaid_leave_quota: d.unpaidLeaveQuota ?? 3,
    })
    .onConflict(["employee_id", "year"])
    .merge(["cuti_quota", "izin_quota", "unpaid_leave_quota", "updated_at"]);

  return NextResponse.json({ message: "Kuota cuti berhasil disimpan" }, { status: 201 });
}
