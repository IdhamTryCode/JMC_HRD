// Worker BullMQ — di-write sebagai .mjs (plain ESM) supaya bisa dijalankan
// langsung oleh node tanpa tsx/ts-node di production image.
// Logic kompleks ditulis di TypeScript files di-bundle saat build (TODO).
import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const QUEUE = "attendance-import";

new Worker(
  QUEUE,
  async (job) => {
    console.log(`[worker] processing ${job.id}`, job.data);
    return { ok: true };
  },
  { connection }
);

console.log(`[worker] listening on queue: ${QUEUE}`);
