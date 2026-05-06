import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  // Roles
  const [superadmin, managerHrd, adminHrd] = await Promise.all([
    prisma.role.upsert({ where: { name: "superadmin" }, update: {}, create: { name: "superadmin", description: "Akses penuh sistem" } }),
    prisma.role.upsert({ where: { name: "manager_hrd" }, update: {}, create: { name: "manager_hrd", description: "Manager HRD" } }),
    prisma.role.upsert({ where: { name: "admin_hrd" }, update: {}, create: { name: "admin_hrd", description: "Admin HRD" } }),
  ]);

  // Positions
  for (const name of ["Manager", "Staf", "Magang", "Karyawan"]) {
    await prisma.position.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Departments
  for (const name of ["Marketing", "HRD", "Production", "Executive", "Commissioner"]) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Offices (default Yogyakarta sebagai placeholder; sesuaikan)
  const offices = [
    { name: "Gedung Utama", latitude: -7.797068, longitude: 110.370529 },
    { name: "Gedung A", latitude: -7.782611, longitude: 110.367083 },
    { name: "Gedung B", latitude: -7.812345, longitude: 110.378900 },
  ];
  for (const o of offices) {
    await prisma.office.upsert({ where: { name: o.name }, update: {}, create: o as never });
  }

  // Superadmin user (password: Admin#123 — wajib diganti)
  const passwordHash = await argon2.hash("Admin#123");
  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      passwordHash,
      roleId: superadmin.id,
    },
  });

  console.log("✓ Seed selesai. Login: superadmin / Admin#123 (segera ganti).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
