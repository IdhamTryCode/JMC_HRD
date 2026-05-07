import type { Knex } from "knex";
import argon2 from "argon2";

export async function seed(knex: Knex): Promise<void> {
  // Skip jika sudah ada sample employees
  const existing = await knex("employees").where("nip", "like", "EMP%").first();
  if (existing) return;

  const [posManager] = await knex("positions").where({ name: "Manager" }).pluck("id");
  const [posStaf] = await knex("positions").where({ name: "Staf" }).pluck("id");
  const [posMagang] = await knex("positions").where({ name: "Magang" }).pluck("id");

  const [deptHrd] = await knex("departments").where({ name: "HRD" }).pluck("id");
  const [deptMarketing] = await knex("departments").where({ name: "Marketing" }).pluck("id");
  const [deptProduction] = await knex("departments").where({ name: "Production" }).pluck("id");

  if (!posManager || !posStaf || !deptHrd) {
    throw new Error("Positions/departments tidak ditemukan — jalankan seed 01 terlebih dahulu");
  }

  // Insert 5 pegawai
  const employeeIds = await knex("employees")
    .insert([
      {
        nip: "EMP001",
        full_name: "Budi Santoso",
        email: "budi.santoso@jmc.local",
        phone: "081234560001",
        position_id: posManager,
        department_id: deptHrd,
        employment_type: "tetap",
        gender: "pria",
        join_date: "2020-03-01",
        is_active: true,
      },
      {
        nip: "EMP002",
        full_name: "Sari Dewi",
        email: "sari.dewi@jmc.local",
        phone: "081234560002",
        position_id: posStaf,
        department_id: deptHrd,
        employment_type: "tetap",
        gender: "wanita",
        join_date: "2021-06-15",
        is_active: true,
      },
      {
        nip: "EMP003",
        full_name: "Andi Wijaya",
        email: "andi.wijaya@jmc.local",
        phone: "081234560003",
        position_id: posStaf,
        department_id: deptMarketing,
        employment_type: "kontrak",
        gender: "pria",
        join_date: "2022-01-10",
        is_active: true,
      },
      {
        nip: "EMP004",
        full_name: "Rina Kusuma",
        email: "rina.kusuma@jmc.local",
        phone: "081234560004",
        position_id: posStaf,
        department_id: deptProduction,
        employment_type: "tetap",
        gender: "wanita",
        join_date: "2019-08-20",
        is_active: true,
      },
      {
        nip: "EMP005",
        full_name: "Dian Pratama",
        email: "dian.pratama@jmc.local",
        phone: "081234560005",
        position_id: posMagang ?? posStaf,
        department_id: deptMarketing,
        employment_type: "magang",
        gender: "pria",
        join_date: "2025-02-01",
        is_active: true,
      },
    ])
    .returning("id");

  const empBudi = employeeIds[0].id;
  const empSari = employeeIds[1].id;

  // Roles
  const roleManagerHrd = await knex("roles").where({ name: "manager_hrd" }).first();
  const roleAdminHrd = await knex("roles").where({ name: "admin_hrd" }).first();
  if (!roleManagerHrd || !roleAdminHrd) {
    throw new Error("Roles tidak ditemukan — jalankan seed 01 terlebih dahulu");
  }

  const passwordHash = await argon2.hash("Pegawai#123");

  // User manager_hrd → link ke Budi Santoso
  const managerExists = await knex("users").where({ username: "managerhrd" }).first();
  if (!managerExists) {
    await knex("users").insert({
      username: "managerhrd",
      email: "budi.santoso@jmc.local",
      password_hash: passwordHash,
      role_id: roleManagerHrd.id,
      employee_id: empBudi,
      is_active: true,
    });
  }

  // User admin_hrd → link ke Sari Dewi
  const adminExists = await knex("users").where({ username: "adminhrd" }).first();
  if (!adminExists) {
    await knex("users").insert({
      username: "adminhrd",
      email: "sari.dewi@jmc.local",
      password_hash: passwordHash,
      role_id: roleAdminHrd.id,
      employee_id: empSari,
      is_active: true,
    });
  }

  console.log("✓ 5 pegawai sample dibuat (EMP001–EMP005)");
  console.log("✓ managerhrd / Pegawai#123 → Budi Santoso (Manager HRD)");
  console.log("✓ adminhrd / Pegawai#123 → Sari Dewi (Admin HRD)");
}
