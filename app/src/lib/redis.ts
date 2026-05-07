import IORedis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var _ioredis: IORedis | undefined;
}

function createRedis() {
  return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    // jangan crash process saat koneksi gagal sementara
    reconnectOnError: () => true,
  });
}

export const redis: IORedis = globalThis._ioredis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalThis._ioredis = redis;
}
