import type { Knex } from "knex";

// Stored functions untuk demo SQL skill (kriteria penilaian #5).
// Kedua function di-define di migration supaya reproducible saat DB di-recreate.

export async function up(knex: Knex): Promise<void> {
  // Function 1: Hitung masa kerja dalam tahun dari join_date
  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION compute_masa_kerja(p_join_date DATE)
    RETURNS INT
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    BEGIN
      RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_join_date))::INT;
    END;
    $$
  `);

  // Function 2: Hitung tunjangan transport dengan semua aturan bisnis:
  //   - jarak <=5 km → 0 (tidak dapat tunjangan)
  //   - jarak >25 km → di-clamp ke 25 km
  //   - hari masuk <19 → 0 (tidak dapat tunjangan)
  //   - pembulatan km: <0.5 ke bawah, >=0.5 ke atas (ROUND standar Postgres)
  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION compute_transport_allowance(
      p_base_fare   NUMERIC,
      p_distance_km NUMERIC,
      p_working_days INT
    )
    RETURNS NUMERIC
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    DECLARE
      v_km_used INT;
    BEGIN
      IF p_distance_km <= 5 THEN RETURN 0; END IF;
      IF p_working_days < 19 THEN RETURN 0; END IF;

      v_km_used := ROUND(LEAST(p_distance_km, 25))::INT;
      RETURN p_base_fare * v_km_used * p_working_days;
    END;
    $$
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`DROP FUNCTION IF EXISTS compute_transport_allowance(NUMERIC, NUMERIC, INT)`);
  await knex.schema.raw(`DROP FUNCTION IF EXISTS compute_masa_kerja(DATE)`);
}
