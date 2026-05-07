import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";

export const ATTENDANCE_IMPORT_QUEUE = "attendance-import";

new Worker(
  ATTENDANCE_IMPORT_QUEUE,
  async (job) => {
    const { importId, filePath } = job.data as { importId: number; filePath: string };

    await db("attendance_imports").where({ id: importId }).update({ status: "processing" });

    let totalRows = 0;
    let successRows = 0;
    let failedRows = 0;
    const errors: { row: number; reason: string }[] = [];

    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      const ws = wb.getWorksheet(1);
      if (!ws) throw new Error("Sheet tidak ditemukan");

      // Expected columns: nip, date (YYYY-MM-DD), check_in (HH:mm), check_out (HH:mm), kehadiran, keterangan
      const rows: unknown[][] = [];
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // skip header
        rows.push(row.values as unknown[]);
      });

      totalRows = rows.length;

      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2;
        const cols = rows[i] as (string | number | null)[];
        // cols[0] is undefined in exceljs (1-indexed)
        const nip = String(cols[1] ?? "").trim();
        const dateRaw = String(cols[2] ?? "").trim();
        const checkInRaw = String(cols[3] ?? "").trim();
        const checkOutRaw = String(cols[4] ?? "").trim();
        const kehadiranRaw = String(cols[5] ?? "hadir").trim().toLowerCase();
        const keterangan = String(cols[6] ?? "").trim() || null;

        if (!nip || !dateRaw) {
          errors.push({ row: rowNum, reason: "NIP atau tanggal kosong" });
          failedRows++;
          continue;
        }

        const employee = await db("employees").where({ nip }).whereNull("deleted_at").first();
        if (!employee) {
          errors.push({ row: rowNum, reason: `NIP ${nip} tidak ditemukan` });
          failedRows++;
          continue;
        }

        const validKehadiran = ["hadir", "cuti", "izin", "unpaid_leave"];
        const kehadiran = validKehadiran.includes(kehadiranRaw) ? kehadiranRaw : "hadir";

        // Parse check_in and check_out times
        let checkInAt: string | null = null;
        let checkOutAt: string | null = null;
        let durationHours = 0;
        let lateMinutes = 0;
        let status: "terpenuhi" | "tidak_terpenuhi" = "tidak_terpenuhi";

        if (kehadiran === "hadir" && checkInRaw) {
          const [inH, inM] = checkInRaw.split(":").map(Number);
          const [outH, outM] = checkOutRaw ? checkOutRaw.split(":").map(Number) : [0, 0];

          checkInAt = `${dateRaw}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00+07:00`;
          if (checkOutRaw) {
            checkOutAt = `${dateRaw}T${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}:00+07:00`;
            durationHours = Math.max(0, (outH * 60 + outM - inH * 60 - inM) / 60);
          }

          // Aturan: jam kerja 08:00, toleransi 15 menit
          const workStart = 8 * 60; // 08:00
          const actualStart = inH * 60 + inM;
          if (actualStart > workStart + 15) {
            lateMinutes = actualStart - workStart;
          }

          status = durationHours >= 8 ? "terpenuhi" : "tidak_terpenuhi";
        }

        try {
          await db("attendances")
            .insert({
              employee_id: employee.id,
              date: dateRaw,
              check_in_at: checkInAt,
              check_out_at: checkOutAt,
              kehadiran,
              duration_hours: durationHours,
              status,
              late_minutes: lateMinutes,
              is_halfday: false,
              verifikasi: "pending",
              keterangan,
              source: "import_excel",
            })
            .onConflict(["employee_id", "date"])
            .merge(["check_in_at", "check_out_at", "kehadiran", "duration_hours", "status", "late_minutes", "keterangan", "source", "updated_at"]);
          successRows++;
        } catch (err) {
          errors.push({ row: rowNum, reason: String(err) });
          failedRows++;
        }
      }

      await db("attendance_imports").where({ id: importId }).update({
        status: "done",
        total_rows: totalRows,
        success_rows: successRows,
        failed_rows: failedRows,
        error_log: errors.length > 0 ? JSON.stringify(errors) : null,
        finished_at: new Date(),
      });
    } catch (err) {
      await db("attendance_imports").where({ id: importId }).update({
        status: "failed",
        error_log: JSON.stringify([{ row: 0, reason: String(err) }]),
        finished_at: new Date(),
      });
    }

    return { importId, totalRows, successRows, failedRows };
  },
  { connection: redis }
);

console.log("✓ Worker started, listening on:", ATTENDANCE_IMPORT_QUEUE);
