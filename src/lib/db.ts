import knex, { type Knex } from "knex";
import knexConfig from "../../knexfile";

const env = process.env.NODE_ENV === "production" ? "production" : "development";

const globalForDb = globalThis as unknown as { db?: Knex };

export const db: Knex = globalForDb.db ?? knex(knexConfig[env]);

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
