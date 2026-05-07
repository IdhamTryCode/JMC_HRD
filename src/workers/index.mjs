// Worker BullMQ — plain ESM supaya bisa dijalankan langsung oleh node tanpa tsx di production.
// TODO (saat implementasi import Excel): instantiate Knex di sini secara mandiri —
//   import knex from "knex"; const db = knex({ client: "pg", connection: process.env.DATABASE_URL });
//   Jangan import dari src/lib/db.ts karena singleton itu untuk Next.js runtime, bukan worker.
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
