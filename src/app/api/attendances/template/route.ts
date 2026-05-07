import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Template Presensi");

  ws.columns = [
    { header: "NIP", key: "nip", width: 20 },
    { header: "Tanggal", key: "tanggal", width: 15 },
    { header: "Jam Masuk", key: "jam_masuk", width: 12 },
    { header: "Jam Keluar", key: "jam_keluar", width: 12 },
    { header: "Lokasi Checkin", key: "lokasi_checkin", width: 18 },
    { header: "Lokasi Checkout", key: "lokasi_checkout", width: 18 },
    { header: "Status", key: "status", width: 15 },
    { header: "Keterangan", key: "keterangan", width: 30 },
  ];

  // Style header row
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };

  // Contoh data
  ws.addRow({ nip: "12345678", tanggal: "2025-01-02", jam_masuk: "08:00", jam_keluar: "17:00", lokasi_checkin: "Gedung Utama", lokasi_checkout: "Gedung Utama", status: "hadir", keterangan: "" });
  ws.addRow({ nip: "12345678", tanggal: "2025-01-03", jam_masuk: "", jam_keluar: "", lokasi_checkin: "", lokasi_checkout: "", status: "cuti", keterangan: "Cuti tahunan" });

  // Petunjuk di bawah
  ws.addRow([]);
  const noteRow = ws.addRow(["Keterangan:"]);
  noteRow.font = { bold: true };
  ws.addRow(["- Status: hadir / cuti / izin / unpaid_leave"]);
  ws.addRow(["- Format Tanggal: YYYY-MM-DD (contoh: 2025-01-15)"]);
  ws.addRow(["- Format Jam: HH:MM (contoh: 08:00, 17:00)"]);
  ws.addRow(["- Lokasi Checkin/Checkout: Gedung Utama, Gedung A, atau Gedung B"]);
  ws.addRow(["- Jam Masuk, Jam Keluar, Lokasi Checkin, dan Lokasi Checkout wajib diisi jika status = hadir"]);
  ws.addRow(["- Lokasi Checkin dan Checkout HARUS sama. Jika berbeda, hari itu tidak terhitung masuk."]);

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="template-presensi.xlsx"`,
    },
  });
}
