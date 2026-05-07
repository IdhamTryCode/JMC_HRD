import type { Knex } from "knex";
import argon2 from "argon2";

export async function seed(knex: Knex): Promise<void> {
  const role = await knex("roles").where({ name: "superadmin" }).first();
  if (!role) throw new Error("Role superadmin tidak ditemukan — jalankan seed 01 terlebih dahulu");

  const exists = await knex("users").where({ username: "superadmin" }).first();
  if (exists) {
    // Pastikan email ter-set (idempotent update)
    if (!exists.email) {
      await knex("users").where({ username: "superadmin" }).update({ email: "superadmin@jmc.local" });
    }
    return;
  }

  const passwordHash = await argon2.hash("Admin#123");
  await knex("users").insert({
    username: "superadmin",
    email: "superadmin@jmc.local",
    password_hash: passwordHash,
    role_id: role.id,
    is_active: true,
  });

  console.log("✓ Superadmin dibuat: superadmin / Admin#123 (segera ganti password)");
}
