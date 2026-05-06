// Entry point worker BullMQ untuk background job (mis. import Excel presensi).
// Worker dijalankan di container terpisah (lihat docker-compose.yml).
import { Worker } from "bullmq";
import { redis } from "@/lib/redis";

const ATTENDANCE_IMPORT_QUEUE = "attendance-import";

new Worker(
  ATTENDANCE_IMPORT_QUEUE,
  async (job) => {
    // TODO: parse Excel, hitung kehadiran sesuai aturan presensi (08–17, ≤15 menit late, dll), tulis ke DB.
    console.log(`[worker] processing ${job.id}`, job.data);
    return { ok: true };
  },
  { connection: redis }
);

console.log("✓ Worker started, listening on:", ATTENDANCE_IMPORT_QUEUE);
