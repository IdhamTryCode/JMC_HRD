import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/attendances/rekap?periodYear=&periodMonth=&search=&page=&limit=
// Rekap presensi per pegawai: total hadir, cuti, izin, unpaid + kuota
export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const periodYear = Number(searchParams.get("periodYear") ?? new Date().getFullYear());
  const periodMonth = Number(searchParams.get("periodMonth") ?? new Date().getMonth() + 1);
  const search = searchParams.get("search") ?? "";
  const departmentId = searchParams.get("departmentId");

  const baseQuery = db("employees")
    .join("positions", "employees.position_id", "positions.id")
    .join("departments", "employees.department_id", "departments.id")
    .whereNull("employees.deleted_at")
    .where("employees.is_active", true);

  if (search) {
    baseQuery.where((q) =>
      q
        .whereILike("employees.full_name", `%${search}%`)
        .orWhereILike("employees.nip", `%${search}%`)
    );
  }
  if (departmentId) baseQuery.where("employees.department_id", departmentId);

  const [{ count }] = await baseQuery.clone().count<{ count: string }[]>("employees.id as count");
  const total = Number(count);

  const employees = await baseQuery
    .clone()
    .select(
      "employees.id",
      "employees.nip",
      "employees.full_name",
      "positions.name as position_name",
      "departments.name as department_name"
    )
    .orderBy("employees.full_name", "asc")
    .limit(limit)
    .offset((page - 1) * limit);

  if (employees.length === 0) {
    return NextResponse.json({ data: [], total, page, limit });
  }

  const empIds = employees.map((e) => e.id);

  // Agregasi presensi per pegawai untuk periode ini
  const attRows = await db("attendances")
    .whereIn("employee_id", empIds)
    .whereRaw("EXTRACT(YEAR FROM date) = ?", [periodYear])
    .whereRaw("EXTRACT(MONTH FROM date) = ?", [periodMonth])
    .groupBy("employee_id", "kehadiran")
    .select("employee_id", "kehadiran")
    .count<{ employee_id: number; kehadiran: string; count: string }[]>("id as count");

  // Kuota cuti/izin/unpaid per pegawai untuk tahun ini
  const quotaRows = await db("leave_quotas")
    .whereIn("employee_id", empIds)
    .where("year", periodYear)
    .select("employee_id", "cuti_quota", "izin_quota", "unpaid_leave_quota");

  // Bangun map untuk look-up cepat
  const attMap = new Map<number, Record<string, number>>();
  for (const r of attRows) {
    if (!attMap.has(r.employee_id)) attMap.set(r.employee_id, {});
    attMap.get(r.employee_id)![r.kehadiran] = Number(r.count);
  }

  const quotaMap = new Map<number, { cuti: number; izin: number; unpaid: number }>();
  for (const r of quotaRows) {
    quotaMap.set(r.employee_id, {
      cuti: Number(r.cuti_quota),
      izin: Number(r.izin_quota),
      unpaid: Number(r.unpaid_leave_quota),
    });
  }

  const data = employees.map((emp) => {
    const att = attMap.get(emp.id) ?? {};
    const quota = quotaMap.get(emp.id) ?? { cuti: 12, izin: 12, unpaid: 3 };
    const hadir = att["hadir"] ?? 0;
    const cuti = att["cuti"] ?? 0;
    const izin = att["izin"] ?? 0;
    const unpaid = att["unpaid_leave"] ?? 0;
    const total_hari = hadir + cuti + izin + unpaid;
    return {
      employee_id: emp.id,
      nip: emp.nip,
      full_name: emp.full_name,
      position_name: emp.position_name,
      department_name: emp.department_name,
      total_hari,
      hadir,
      status_terpenuhi: hadir >= 19,
      cuti,
      cuti_quota: quota.cuti,
      izin,
      izin_quota: quota.izin,
      unpaid_leave: unpaid,
      unpaid_quota: quota.unpaid,
    };
  });

  return NextResponse.json({ data, total, page, limit });
}
