import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const id = Number(params.id);
  const emp = await db("employees")
    .join("positions", "employees.position_id", "positions.id")
    .join("departments", "employees.department_id", "departments.id")
    .leftJoin("kelurahan", "employees.address_kelurahan_id", "kelurahan.id")
    .leftJoin("kecamatan", "kelurahan.kecamatan_id", "kecamatan.id")
    .leftJoin("kabupaten", "kecamatan.kabupaten_id", "kabupaten.id")
    .leftJoin("provinsi", "kabupaten.provinsi_id", "provinsi.id")
    .leftJoin("kabupaten as birth_kab", "employees.birth_kabupaten_id", "birth_kab.id")
    .leftJoin("provinsi as birth_prov", "birth_kab.provinsi_id", "birth_prov.id")
    .where("employees.id", id)
    .whereNull("employees.deleted_at")
    .select(
      "employees.*",
      "positions.name as position_name",
      "departments.name as department_name",
      "kelurahan.name as kelurahan_name",
      "kecamatan.id as kecamatan_id",
      "kecamatan.name as kecamatan_name",
      "kabupaten.id as kabupaten_id",
      "kabupaten.name as kabupaten_name",
      "provinsi.id as provinsi_id",
      "provinsi.name as provinsi_name",
      "birth_kab.name as birth_kabupaten_name",
      "birth_prov.name as birth_provinsi_name",
      db.raw("compute_masa_kerja(employees.join_date) as masa_kerja_tahun")
    )
    .first();

  if (!emp) return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });

  const educations = await db("employee_educations")
    .where({ employee_id: id })
    .orderBy("sort_order")
    .select("*");

  return NextResponse.json({ ...emp, educations });
}

const updateSchema = z.object({
  nip: z.string().min(8).max(20).regex(/^\d+$/, "NIP hanya boleh berisi angka").optional(),
  fullName: z.string().min(1).max(150).regex(/^[A-Za-z0-9' ]+$/, "Nama hanya boleh huruf, angka, tanda petik atas ('), dan spasi").optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+[1-9]\d{6,19}$/, "Format internasional, contoh: +6282218458888").optional(),
  positionId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional(),
  employmentType: z.enum(["tetap", "kontrak", "magang"]).optional(),
  gender: z.enum(["pria", "wanita"]).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  birthKabupatenId: z.number().int().positive().nullable().optional(),
  maritalStatus: z.enum(["kawin", "tidak_kawin"]).nullable().optional(),
  childrenCount: z.number().int().min(0).max(99).optional(),
  joinDate: z.string().optional(),
  addressKelurahanId: z.number().int().positive().nullable().optional(),
  addressDetail: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  isActive: z.boolean().optional(),
  educations: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        level: z.string().min(1),
        institution: z.string().min(1),
        major: z.string().optional(),
        yearStart: z.number().int().optional(),
        yearEnd: z.number().int().optional(),
      })
    )
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const id = Number(params.id);
  const target = await db("employees").where({ id }).whereNull("deleted_at").first();
  if (!target) return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const updates: Record<string, unknown> = { updated_at: new Date() };

  if (d.nip !== undefined) {
    const dup = await db("employees").where("nip", d.nip).whereNot("id", id).whereNull("deleted_at").first();
    if (dup) return NextResponse.json({ error: "NIP sudah digunakan" }, { status: 409 });
    updates.nip = d.nip;
  }
  if (d.email !== undefined) {
    const dup = await db("employees").where("email", d.email).whereNot("id", id).whereNull("deleted_at").first();
    if (dup) return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
    updates.email = d.email;
  }
  if (d.fullName !== undefined) updates.full_name = d.fullName;
  if (d.phone !== undefined) updates.phone = d.phone;
  if (d.positionId !== undefined) updates.position_id = d.positionId;
  if (d.departmentId !== undefined) updates.department_id = d.departmentId;
  if (d.employmentType !== undefined) updates.employment_type = d.employmentType;
  if (d.gender !== undefined) updates.gender = d.gender;
  if (d.birthDate !== undefined) updates.birth_date = d.birthDate;
  if (d.birthKabupatenId !== undefined) updates.birth_kabupaten_id = d.birthKabupatenId;
  if (d.maritalStatus !== undefined) updates.marital_status = d.maritalStatus;
  if (d.childrenCount !== undefined) updates.children_count = d.childrenCount;
  if (d.joinDate !== undefined) updates.join_date = d.joinDate;
  if (d.addressKelurahanId !== undefined) updates.address_kelurahan_id = d.addressKelurahanId;
  if (d.addressDetail !== undefined) updates.address_detail = d.addressDetail;
  if (d.latitude !== undefined) updates.latitude = d.latitude;
  if (d.longitude !== undefined) updates.longitude = d.longitude;
  if (d.isActive !== undefined) updates.is_active = d.isActive;

  await db("employees").where({ id }).update(updates);

  // replace educations jika dikirim
  if (d.educations !== undefined) {
    await db("employee_educations").where({ employee_id: id }).delete();
    if (d.educations.length > 0) {
      await db("employee_educations").insert(
        d.educations.map((e, i) => ({
          employee_id: id,
          level: e.level,
          institution: e.institution,
          major: e.major ?? null,
          year_start: e.yearStart ?? null,
          year_end: e.yearEnd ?? null,
          sort_order: i,
        }))
      );
    }
  }

  await logActivity({
    userId: user.userId,
    action: "UPDATE_EMPLOYEE",
    module: "employees",
    description: `Update pegawai id=${id}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ message: "Pegawai berhasil diupdate" });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const id = Number(params.id);
  const target = await db("employees").where({ id }).whereNull("deleted_at").first();
  if (!target) return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });

  // Admin HRD tidak boleh menghapus pegawai yang terkait akun superadmin
  const linkedSuperadmin = await db("users")
    .join("roles", "users.role_id", "roles.id")
    .where("users.employee_id", id)
    .whereNull("users.deleted_at")
    .where("roles.name", "superadmin")
    .first();
  if (linkedSuperadmin) {
    return NextResponse.json(
      { error: "Tidak dapat menghapus pegawai yang terkait akun superadmin" },
      { status: 403 }
    );
  }

  await db("employees").where({ id }).update({ deleted_at: new Date(), is_active: false });

  await logActivity({
    userId: user.userId,
    action: "DELETE_EMPLOYEE",
    module: "employees",
    description: `Hapus pegawai: ${target.full_name} (${target.nip})`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ message: "Pegawai berhasil dihapus" });
}
