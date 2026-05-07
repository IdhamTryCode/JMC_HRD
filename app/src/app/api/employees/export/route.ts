import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const rows = await db("employees")
    .join("positions", "employees.position_id", "positions.id")
    .join("departments", "employees.department_id", "departments.id")
    .leftJoin("kelurahan", "employees.address_kelurahan_id", "kelurahan.id")
    .leftJoin("kecamatan", "kelurahan.kecamatan_id", "kecamatan.id")
    .leftJoin("kabupaten as kab", "kecamatan.kabupaten_id", "kab.id")
    .whereNull("employees.deleted_at")
    .select(
      "employees.nip",
      "employees.full_name",
      "employees.email",
      "employees.phone",
      "employees.employment_type",
      "employees.gender",
      "employees.birth_date",
      "employees.join_date",
      "employees.marital_status",
      "employees.children_count",
      "employees.is_active",
      "positions.name as jabatan",
      "departments.name as departemen",
      "kelurahan.name as kelurahan",
      "kecamatan.name as kecamatan",
      "kab.name as kabupaten",
      db.raw("compute_masa_kerja(employees.join_date) as masa_kerja_tahun")
    )
    .orderBy("employees.full_name");

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Data Pegawai");

  ws.columns = [
    { header: "NIP", key: "nip", width: 18 },
    { header: "Nama Lengkap", key: "full_name", width: 28 },
    { header: "Email", key: "email", width: 28 },
    { header: "No. HP", key: "phone", width: 16 },
    { header: "Jabatan", key: "jabatan", width: 18 },
    { header: "Departemen", key: "departemen", width: 18 },
    { header: "Jenis Karyawan", key: "employment_type", width: 16 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Tgl Lahir", key: "birth_date", width: 14 },
    { header: "Tgl Bergabung", key: "join_date", width: 14 },
    { header: "Masa Kerja (thn)", key: "masa_kerja_tahun", width: 16 },
    { header: "Status Nikah", key: "marital_status", width: 14 },
    { header: "Jml Anak", key: "children_count", width: 10 },
    { header: "Domisili (Kelurahan)", key: "kelurahan", width: 20 },
    { header: "Kecamatan", key: "kecamatan", width: 18 },
    { header: "Kabupaten", key: "kabupaten", width: 18 },
    { header: "Aktif", key: "is_active", width: 8 },
  ];

  // header style
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };

  rows.forEach((r) => {
    ws.addRow({
      ...r,
      gender: r.gender === "pria" ? "Laki-laki" : r.gender === "wanita" ? "Perempuan" : "",
      marital_status: r.marital_status === "kawin" ? "Kawin" : r.marital_status === "tidak_kawin" ? "Tidak Kawin" : "",
      is_active: r.is_active ? "Ya" : "Tidak",
    });
  });

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="data-pegawai-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
