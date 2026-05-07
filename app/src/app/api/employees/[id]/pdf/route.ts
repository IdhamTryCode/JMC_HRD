import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const id = Number(params.id);
  const emp = await db("employees")
    .join("positions", "employees.position_id", "positions.id")
    .join("departments", "employees.department_id", "departments.id")
    .leftJoin("kelurahan", "employees.address_kelurahan_id", "kelurahan.id")
    .leftJoin("kecamatan", "kelurahan.kecamatan_id", "kecamatan.id")
    .leftJoin("kabupaten as kab", "kecamatan.kabupaten_id", "kab.id")
    .leftJoin("provinsi", "kab.provinsi_id", "provinsi.id")
    .where("employees.id", id)
    .whereNull("employees.deleted_at")
    .select(
      "employees.*",
      "positions.name as position_name",
      "departments.name as department_name",
      "kelurahan.name as kelurahan_name",
      "kecamatan.name as kecamatan_name",
      "kab.name as kabupaten_name",
      "provinsi.name as provinsi_name",
      db.raw("compute_masa_kerja(employees.join_date) as masa_kerja_tahun")
    )
    .first();

  if (!emp) return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });

  const educations = await db("employee_educations")
    .where({ employee_id: id })
    .orderBy("sort_order")
    .select("*");

  // Gunakan dynamic import agar tidak di-bundle webpack
  const PDFDocument = (await import("pdfkit")).default;

  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const pdfDone = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header
  doc.fontSize(18).font("Helvetica-Bold").text("DATA PEGAWAI", { align: "center" });
  doc.fontSize(12).font("Helvetica").text("JMC Indonesia", { align: "center" });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  function row(label: string, value: string | number | null | undefined) {
    doc.font("Helvetica-Bold").text(`${label}:`, { continued: true, width: 180 });
    doc.font("Helvetica").text(String(value ?? "—"));
  }

  row("NIP", emp.nip);
  row("Nama Lengkap", emp.full_name);
  row("Email", emp.email);
  row("No. HP", emp.phone);
  row("Jabatan", emp.position_name);
  row("Departemen", emp.department_name);
  row("Jenis Karyawan", emp.employment_type);
  row("Gender", emp.gender === "pria" ? "Laki-laki" : emp.gender === "wanita" ? "Perempuan" : "—");
  row("Tanggal Lahir", emp.birth_date ?? "—");
  row("Status Pernikahan", emp.marital_status === "kawin" ? "Kawin" : emp.marital_status === "tidak_kawin" ? "Tidak Kawin" : "—");
  row("Jumlah Anak", emp.children_count);
  row("Tanggal Bergabung", emp.join_date);
  row("Masa Kerja", emp.masa_kerja_tahun != null ? `${emp.masa_kerja_tahun} tahun` : "—");
  row("Alamat", [emp.address_detail, emp.kelurahan_name, emp.kecamatan_name, emp.kabupaten_name, emp.provinsi_name].filter(Boolean).join(", ") || "—");

  if (educations.length > 0) {
    doc.moveDown();
    doc.font("Helvetica-Bold").fontSize(13).text("Riwayat Pendidikan");
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(11);
    educations.forEach((e, i) => {
      doc.text(`${i + 1}. ${e.level} — ${e.institution}${e.major ? ` (${e.major})` : ""}${e.year_start ? `, ${e.year_start}–${e.year_end ?? ""}` : ""}`);
    });
  }

  doc.end();
  const pdfBuffer = await pdfDone;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pegawai-${emp.nip}.pdf"`,
    },
  });
}
