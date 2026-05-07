import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const usernamesRaw = searchParams.get("usernames") ?? "";
  const modulesRaw = searchParams.get("modules") ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const usernameList = usernamesRaw ? usernamesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const moduleList = modulesRaw ? modulesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  function applyFilters(q: ReturnType<typeof db>) {
    q.leftJoin("users", "activity_logs.user_id", "users.id");
    if (usernameList.length > 0) q.whereIn("users.username", usernameList);
    if (moduleList.length > 0) q.whereIn("activity_logs.module", moduleList);
    if (dateFrom) q.where("activity_logs.created_at", ">=", new Date(dateFrom));
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      q.where("activity_logs.created_at", "<", to);
    }
    return q;
  }

  const [{ count }] = await applyFilters(
    db("activity_logs")
  ).count<{ count: string }[]>("activity_logs.id as count");
  const total = Number(count);

  const rows = await applyFilters(db("activity_logs"))
    .select(
      "activity_logs.id",
      "activity_logs.action",
      "activity_logs.module",
      "activity_logs.description",
      "activity_logs.ip_address",
      "activity_logs.created_at",
      "users.username"
    )
    .orderBy("activity_logs.created_at", "desc")
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({ data: rows, total, page, limit });
}
