import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const employeeId = searchParams.get("employeeId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const periodYear = searchParams.get("periodYear");
  const periodMonth = searchParams.get("periodMonth");
  const kehadiran = searchParams.get("kehadiran");
  const verifikasi = searchParams.get("verifikasi");
  const search = searchParams.get("search") ?? "";

  function buildBase() {
    const q = db("attendances")
      .join("employees", "attendances.employee_id", "employees.id")
      .join("positions", "employees.position_id", "positions.id")
      .join("departments", "employees.department_id", "departments.id")
      .whereNull("employees.deleted_at");

    if (employeeId) q.where("attendances.employee_id", employeeId);
    if (kehadiran) q.where("attendances.kehadiran", kehadiran);
    if (verifikasi) q.where("attendances.verifikasi", verifikasi);
    if (dateFrom) q.where("attendances.date", ">=", dateFrom);
    if (dateTo) q.where("attendances.date", "<=", dateTo);
    if (periodYear && periodMonth) {
      q.whereRaw("EXTRACT(YEAR FROM attendances.date) = ?", [Number(periodYear)])
        .whereRaw("EXTRACT(MONTH FROM attendances.date) = ?", [Number(periodMonth)]);
    }
    if (search) {
      q.where((w) =>
        w
          .whereILike("employees.full_name", `%${search}%`)
          .orWhereILike("employees.nip", `%${search}%`)
      );
    }
    return q;
  }

  const [{ count }] = await buildBase().count<{ count: string }[]>("attendances.id as count");
  const total = Number(count);

  const rows = await buildBase()
    .select(
      "attendances.id",
      "attendances.employee_id",
      "attendances.date",
      "attendances.check_in_at",
      "attendances.check_out_at",
      "attendances.kehadiran",
      "attendances.duration_hours",
      "attendances.status",
      "attendances.late_minutes",
      "attendances.is_halfday",
      "attendances.verifikasi",
      "attendances.verifikator",
      "attendances.keterangan",
      "attendances.source",
      "employees.nip",
      "employees.full_name",
      "positions.name as position_name",
      "departments.name as department_name"
    )
    .orderBy("attendances.date", "desc")
    .orderBy("employees.full_name", "asc")
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({ data: rows, total, page, limit });
}

const attendanceSchema = z.object({
  employeeId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkInAt: z.string().datetime({ offset: true }).nullable().optional(),
  checkOutAt: z.string().datetime({ offset: true }).nullable().optional(),
  checkInOfficeId: z.number().int().positive().nullable().optional(),
  checkOutOfficeId: z.number().int().positive().nullable().optional(),
  kehadiran: z.enum(["hadir", "cuti", "izin", "unpaid_leave"]).default("hadir"),
  durationHours: z.number().min(0).max(24).optional(),
  lateMinutes: z.number().int().min(0).optional(),
  isHalfday: z.boolean().optional(),
  keterangan: z.string().max(1000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;

  const existing = await db("attendances")
    .where({ employee_id: d.employeeId, date: d.date })
    .first();
  if (existing) {
    return NextResponse.json({ error: "Presensi untuk tanggal ini sudah ada" }, { status: 409 });
  }

  // Validasi: check-in dan check-out harus di gedung yang sama
  if (d.checkInOfficeId && d.checkOutOfficeId && d.checkInOfficeId !== d.checkOutOfficeId) {
    return NextResponse.json(
      { error: "Gedung check-in dan check-out harus sama. Presensi tidak dihitung." },
      { status: 422 }
    );
  }

  const lateMinutes = d.lateMinutes ?? 0;
  const durationHours = d.durationHours ?? 0;
  // >15 mnt terlambat dan durasi < 8 jam = halfday
  const isHalfday = d.isHalfday ?? (lateMinutes > 15 && durationHours < 8);
  const attendanceStatus = durationHours >= 8 ? "terpenuhi" : "tidak_terpenuhi";

  const [att] = await db("attendances")
    .insert({
      employee_id: d.employeeId,
      date: d.date,
      check_in_at: d.checkInAt ?? null,
      check_out_at: d.checkOutAt ?? null,
      check_in_office_id: d.checkInOfficeId ?? null,
      check_out_office_id: d.checkOutOfficeId ?? null,
      kehadiran: d.kehadiran,
      duration_hours: durationHours,
      status: attendanceStatus,
      late_minutes: lateMinutes,
      is_halfday: isHalfday,
      verifikasi: "pending",
      keterangan: d.keterangan ?? null,
      source: "manual",
    })
    .returning("id");

  await logActivity({
    userId: user.userId,
    action: "CREATE_ATTENDANCE",
    module: "attendances",
    description: `Tambah presensi manual: employee_id=${d.employeeId} tanggal=${d.date}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ id: att.id, message: "Presensi berhasil ditambahkan" }, { status: 201 });
}
