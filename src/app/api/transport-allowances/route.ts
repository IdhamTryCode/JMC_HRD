import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const periodYear = searchParams.get("periodYear");
  const periodMonth = searchParams.get("periodMonth");
  const search = searchParams.get("search") ?? "";

  function buildBase() {
    const q = db("transport_allowances")
      .join("employees", "transport_allowances.employee_id", "employees.id")
      .join("positions", "employees.position_id", "positions.id")
      .join("departments", "employees.department_id", "departments.id")
      .whereNull("employees.deleted_at");

    if (periodYear) q.where("transport_allowances.period_year", periodYear);
    if (periodMonth) q.where("transport_allowances.period_month", periodMonth);
    if (search) {
      q.where((w) =>
        w
          .whereILike("employees.full_name", `%${search}%`)
          .orWhereILike("employees.nip", `%${search}%`)
      );
    }
    return q;
  }

  const [{ count }] = await buildBase().count<{ count: string }[]>("transport_allowances.id as count");
  const total = Number(count);

  const rows = await buildBase()
    .select(
      "transport_allowances.*",
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
