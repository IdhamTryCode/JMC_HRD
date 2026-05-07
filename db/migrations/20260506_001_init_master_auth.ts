import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // --- ENUM types ---
  await knex.schema.raw(`CREATE TYPE employment_type AS ENUM ('kontrak', 'tetap', 'magang')`);
  await knex.schema.raw(`CREATE TYPE marital_status AS ENUM ('kawin', 'tidak_kawin')`);
  await knex.schema.raw(`CREATE TYPE gender AS ENUM ('pria', 'wanita')`);
  await knex.schema.raw(`CREATE TYPE attendance_kind AS ENUM ('hadir', 'cuti', 'izin', 'unpaid_leave')`);
  await knex.schema.raw(`CREATE TYPE attendance_status AS ENUM ('terpenuhi', 'tidak_terpenuhi')`);
  await knex.schema.raw(`CREATE TYPE verification_status AS ENUM ('pending', 'disetujui', 'ditolak')`);
  await knex.schema.raw(`CREATE TYPE verifier_role AS ENUM ('lead', 'manager', 'hrd')`);
  await knex.schema.raw(`CREATE TYPE attendance_source AS ENUM ('import_excel', 'manual')`);
  await knex.schema.raw(`CREATE TYPE import_status AS ENUM ('queued', 'processing', 'done', 'failed')`);

  // --- roles ---
  await knex.schema.createTable("roles", (t) => {
    t.increments("id").primary();
    t.string("name", 50).notNullable().unique();
    t.text("description").nullable();
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  // --- wilayah ---
  await knex.schema.createTable("provinsi", (t) => {
    t.integer("id").primary();
    t.string("name", 100).notNullable();
  });

  await knex.schema.createTable("kabupaten", (t) => {
    t.integer("id").primary();
    t.string("name", 100).notNullable();
    t.integer("provinsi_id").notNullable().references("id").inTable("provinsi").onDelete("RESTRICT");
    t.index("name");
  });

  await knex.schema.createTable("kecamatan", (t) => {
    t.integer("id").primary();
    t.string("name", 100).notNullable();
    t.integer("kabupaten_id").notNullable().references("id").inTable("kabupaten").onDelete("RESTRICT");
    t.index("name");
  });

  await knex.schema.createTable("kelurahan", (t) => {
    t.integer("id").primary();
    t.string("name", 100).notNullable();
    t.integer("kecamatan_id").notNullable().references("id").inTable("kecamatan").onDelete("RESTRICT");
    t.index("name");
  });

  // --- positions & departments ---
  await knex.schema.createTable("positions", (t) => {
    t.increments("id").primary();
    t.string("name", 50).notNullable().unique();
  });

  await knex.schema.createTable("departments", (t) => {
    t.increments("id").primary();
    t.string("name", 100).notNullable().unique();
  });

  // --- offices ---
  await knex.schema.createTable("offices", (t) => {
    t.increments("id").primary();
    t.string("name", 100).notNullable().unique();
    t.decimal("latitude", 10, 7).notNullable();
    t.decimal("longitude", 10, 7).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("offices");
  await knex.schema.dropTableIfExists("departments");
  await knex.schema.dropTableIfExists("positions");
  await knex.schema.dropTableIfExists("kelurahan");
  await knex.schema.dropTableIfExists("kecamatan");
  await knex.schema.dropTableIfExists("kabupaten");
  await knex.schema.dropTableIfExists("provinsi");
  await knex.schema.dropTableIfExists("roles");

  await knex.schema.raw(`DROP TYPE IF EXISTS import_status`);
  await knex.schema.raw(`DROP TYPE IF EXISTS attendance_source`);
  await knex.schema.raw(`DROP TYPE IF EXISTS verifier_role`);
  await knex.schema.raw(`DROP TYPE IF EXISTS verification_status`);
  await knex.schema.raw(`DROP TYPE IF EXISTS attendance_status`);
  await knex.schema.raw(`DROP TYPE IF EXISTS attendance_kind`);
  await knex.schema.raw(`DROP TYPE IF EXISTS gender`);
  await knex.schema.raw(`DROP TYPE IF EXISTS marital_status`);
  await knex.schema.raw(`DROP TYPE IF EXISTS employment_type`);
}
