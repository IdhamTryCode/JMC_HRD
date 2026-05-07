import { describe, it, expect } from "vitest";
import { z } from "zod";

// --- Skema yang sama dengan API route ---
const employeeSchema = z.object({
  nip: z.string().min(1).max(20),
  fullName: z.string().min(1).max(150),
  email: z.string().email(),
  phone: z.string().min(1).max(20),
  positionId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  employmentType: z.enum(["tetap", "kontrak", "magang"]),
  gender: z.enum(["pria", "wanita"]).optional(),
  maritalStatus: z.enum(["kawin", "tidak_kawin"]).optional(),
  joinDate: z.string(),
});

const passwordSchema = z
  .string()
  .min(8, "Minimal 8 karakter")
  .regex(/[A-Z]/, "Harus ada huruf kapital")
  .regex(/[0-9]/, "Harus ada angka")
  .regex(/[^A-Za-z0-9]/, "Harus ada karakter spesial");

describe("employeeSchema", () => {
  const valid = {
    nip: "1234567890",
    fullName: "Budi Santoso",
    email: "budi@jmc.id",
    phone: "081234567890",
    positionId: 1,
    departmentId: 2,
    employmentType: "tetap",
    joinDate: "2024-01-01",
  };

  it("valid payload lolos", () => {
    expect(employeeSchema.safeParse(valid).success).toBe(true);
  });

  it("email tidak valid ditolak", () => {
    const r = employeeSchema.safeParse({ ...valid, email: "bukan-email" });
    expect(r.success).toBe(false);
  });

  it("employmentType tidak valid ditolak", () => {
    const r = employeeSchema.safeParse({ ...valid, employmentType: "freelance" });
    expect(r.success).toBe(false);
  });

  it("gender hanya pria/wanita", () => {
    expect(employeeSchema.safeParse({ ...valid, gender: "pria" }).success).toBe(true);
    expect(employeeSchema.safeParse({ ...valid, gender: "wanita" }).success).toBe(true);
    expect(employeeSchema.safeParse({ ...valid, gender: "L" }).success).toBe(false);
    expect(employeeSchema.safeParse({ ...valid, gender: "P" }).success).toBe(false);
  });

  it("maritalStatus hanya kawin/tidak_kawin", () => {
    expect(employeeSchema.safeParse({ ...valid, maritalStatus: "kawin" }).success).toBe(true);
    expect(employeeSchema.safeParse({ ...valid, maritalStatus: "tidak_kawin" }).success).toBe(true);
    expect(employeeSchema.safeParse({ ...valid, maritalStatus: "lajang" }).success).toBe(false);
    expect(employeeSchema.safeParse({ ...valid, maritalStatus: "menikah" }).success).toBe(false);
  });

  it("NIP kosong ditolak", () => {
    const r = employeeSchema.safeParse({ ...valid, nip: "" });
    expect(r.success).toBe(false);
  });

  it("positionId harus integer positif", () => {
    expect(employeeSchema.safeParse({ ...valid, positionId: 0 }).success).toBe(false);
    expect(employeeSchema.safeParse({ ...valid, positionId: -1 }).success).toBe(false);
    expect(employeeSchema.safeParse({ ...valid, positionId: 1.5 }).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("password kuat lolos", () => {
    expect(passwordSchema.safeParse("Rahasia123!").success).toBe(true);
    expect(passwordSchema.safeParse("Admin@2024").success).toBe(true);
  });

  it("terlalu pendek ditolak", () => {
    expect(passwordSchema.safeParse("Ab1!").success).toBe(false);
  });

  it("tanpa huruf kapital ditolak", () => {
    expect(passwordSchema.safeParse("rahasia123!").success).toBe(false);
  });

  it("tanpa angka ditolak", () => {
    expect(passwordSchema.safeParse("Rahasia!!!").success).toBe(false);
  });

  it("tanpa karakter spesial ditolak", () => {
    expect(passwordSchema.safeParse("Rahasia123").success).toBe(false);
  });
});
