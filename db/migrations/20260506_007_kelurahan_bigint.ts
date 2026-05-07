import type { Knex } from "knex";

// Kelurahan ID dari sumber data BPS adalah 10 digit (contoh: 1101012001)
// melebihi batas INT (2,147,483,647). Perlu diubah ke BIGINT.
export async function up(knex: Knex): Promise<void> {
  // Knex .alter() drops NOT NULL on PK — use raw SQL instead
  await knex.raw(`ALTER TABLE kelurahan ALTER COLUMN id TYPE BIGINT`);
  await knex.raw(`ALTER TABLE kelurahan ALTER COLUMN kecamatan_id TYPE BIGINT`);
  await knex.raw(`ALTER TABLE employees ALTER COLUMN address_kelurahan_id TYPE BIGINT`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE employees ALTER COLUMN address_kelurahan_id TYPE INTEGER`);
  await knex.raw(`ALTER TABLE kelurahan ALTER COLUMN kecamatan_id TYPE INTEGER`);
  await knex.raw(`ALTER TABLE kelurahan ALTER COLUMN id TYPE INTEGER`);
}
