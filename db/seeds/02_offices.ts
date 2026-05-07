import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("offices")
    .insert([
      { name: "Gedung Utama", latitude: -7.797068, longitude: 110.370529 },
      { name: "Gedung A",     latitude: -7.782611, longitude: 110.367083 },
      { name: "Gedung B",     latitude: -7.812345, longitude: 110.378900 },
    ])
    .onConflict("name")
    .ignore();
}
