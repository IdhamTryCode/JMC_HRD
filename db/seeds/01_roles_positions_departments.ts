import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("roles")
    .insert([
      { name: "superadmin", description: "Akses penuh sistem" },
      { name: "manager_hrd", description: "Manager HRD" },
      { name: "admin_hrd", description: "Admin HRD" },
    ])
    .onConflict("name")
    .ignore();

  await knex("positions")
    .insert(["Manager", "Staf", "Magang", "Karyawan"].map((name) => ({ name })))
    .onConflict("name")
    .ignore();

  await knex("departments")
    .insert(
      ["Marketing", "HRD", "Production", "Executive", "Commissioner"].map((name) => ({ name }))
    )
    .onConflict("name")
    .ignore();
}
