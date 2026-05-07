import type { Knex } from "knex";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL ?? "postgresql://jmc:jmc@localhost:5433/jmc",
    pool: { min: 2, max: 10 },
    migrations: {
      directory: resolve(__dirname, "db/migrations"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    seeds: {
      directory: resolve(__dirname, "db/seeds"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
  },
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 20 },
    migrations: {
      directory: resolve(__dirname, "db/migrations"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    seeds: {
      directory: resolve(__dirname, "db/seeds"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
  },
};

export default config;
