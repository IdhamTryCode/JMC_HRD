import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const periodYear = Number(searchParams.get("periodYear") ?? new Date().getFullYear());
  const periodMonth = Number(searchParams.get("periodMonth") ?? new Date().getMonth() + 1);
  const search = searchParams.get("search") ?? "";

  const query = db("attendances")
    .join("employees", "attendances.employee_id", "employees.id")
    .join("positions", "employees.position_id", "positions.id")
    .join("departments", "employees.department_id", "departments.id")
    .whereNull("employees.deleted_at")
    .whereRaw("EXTRACT(YEAR FROM attendances.date) = ?", [periodYear])
    .whereRaw("EXTRACT(MONTH FROM attendances.date) = ?", [periodMonth]);

  if (search) {
    query.where((q) =>
      q
        .whereILike("employees.full_name", `%${search}%`)
        .orWhereILike("employees.nip", `%${search}%`)
    );
  }

  const rows = await query
    .select(
      "employees.nip",
      "employees.full_name",
      "positions.name as position_name",
      "departments.name as department_name",
      "attendances.date",
      "attendances.check_in_at",
      "attendances.check_out_at",
      "attendances.kehadiran",
      "attendances.duration_hours",
      "attendances.late_minutes",
      "attendances.status",
      "attendances.verifikasi",
      "attendances.keterangan"
    )
    .orderBy(["employees.full_name", "attendances.date"]);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Presensi");

  ws.columns = [
    { header: "NIP", key: "nip", width: 15 },
    { header: "Nama", key: "full_name", width: 25 },
    { header: "Jabatan", key: "position_name", width: 20 },
    { header: "Departemen", key: "department_name", width: 20 },
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Jam Masuk", key: "check_in_at", width: 18 },
    { header: "Jam Keluar", key: "check_out_at", width: 18 },
    { header: "Kehadiran", key: "kehadiran", width: 14 },
    { header: "Durasi (jam)", key: "duration_hours", width: 13 },
    { header: "Terlambat (mnt)", key: "late_minutes", width: 15 },
    { header: "Status", key: "status", width: 16 },
    { header: "Verifikasi", key: "verifikasi", width: 12 },
    { header: "Keterangan", key: "keterangan", width: 30 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };

  for (const r of rows) {
    ws.addRow({
      nip: r.nip,
      full_name: r.full_name,
      position_name: r.position_name,
      department_name: r.department_name,
      date: r.date,
      check_in_at: r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "",
      check_out_at: r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "",
      kehadiran: r.kehadiran,
      duration_hours: r.duration_hours != null ? Number(r.duration_hours).toFixed(1) : "",
      late_minutes: r.late_minutes ?? 0,
      status: r.status,
      verifikasi: r.verifikasi,
      keterangan: r.keterangan ?? "",
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `presensi-${periodYear}-${String(periodMonth).padStart(2, "0")}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
