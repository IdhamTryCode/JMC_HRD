import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") ?? "";
  const positionId = searchParams.get("positionId");
  const departmentId = searchParams.get("departmentId");
  const employmentType = searchParams.get("employmentType");
  const masaKerjaOp = searchParams.get("masaKerjaOp"); // gt | gte | lt | lte | eq
  const masaKerjaVal = searchParams.get("masaKerjaVal");
  const isActive = searchParams.get("isActive");
  const sortByRaw = searchParams.get("sortBy") ?? "full_name";
  const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";

  // Whitelist kolom sort yang diizinkan
  const SORT_COLUMNS: Record<string, string> = {
    full_name: "employees.full_name",
    nip: "employees.nip",
    position_name: "positions.name",
    department_name: "departments.name",
    join_date: "employees.join_date",
    masa_kerja_tahun: "employees.join_date", // order by join_date inverse untuk masa kerja
    employment_type: "employees.employment_type",
  };
  const sortBy = SORT_COLUMNS[sortByRaw] ?? "employees.full_name";

  function buildBase() {
    const q = db("employees")
      .join("positions", "employees.position_id", "positions.id")
      .join("departments", "employees.department_id", "departments.id")
      .whereNull("employees.deleted_at");

    if (search) {
      q.where((w) =>
        w
          .whereILike("employees.full_name", `%${search}%`)
          .orWhereILike("employees.nip", `%${search}%`)
          .orWhereILike("positions.name", `%${search}%`)
      );
    }
    if (positionId) q.where("employees.position_id", positionId);
    if (departmentId) q.where("employees.department_id", departmentId);
    if (employmentType) {
      const types = employmentType.split(",").map((t) => t.trim()).filter(Boolean);
      if (types.length === 1) q.where("employees.employment_type", types[0]);
      else if (types.length > 1) q.whereIn("employees.employment_type", types);
    }
    if (isActive !== null && isActive !== "") q.where("employees.is_active", isActive === "true");

    if (masaKerjaOp && masaKerjaVal) {
      const opMap: Record<string, string> = { gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=" };
      const op = opMap[masaKerjaOp] ?? "=";
      q.whereRaw(`compute_masa_kerja(employees.join_date) ${op} ?`, [Number(masaKerjaVal)]);
    }
    return q;
  }

  const [{ count }] = await buildBase().count<{ count: string }[]>("employees.id as count");
  const total = Number(count);

  const rows = await buildBase()
    .select(
      "employees.id",
      "employees.nip",
      "employees.full_name",
      "employees.email",
      "employees.phone",
      "employees.employment_type",
      "employees.gender",
      "employees.join_date",
      "employees.is_active",
      "employees.photo_path",
      "positions.name as position_name",
      "departments.name as department_name",
      db.raw("compute_masa_kerja(employees.join_date) as masa_kerja_tahun")
    )
    .orderBy(sortBy, sortByRaw === "masa_kerja_tahun" ? (sortDir === "asc" ? "desc" : "asc") : sortDir)
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({ data: rows, total, page, limit });
}

const employeeSchema = z.object({
  nip: z.string().min(8).max(20).regex(/^\d+$/, "NIP hanya boleh berisi angka"),
  fullName: z.string().min(1).max(150).regex(/^[A-Za-z0-9' ]+$/, "Nama hanya boleh huruf, angka, tanda petik atas ('), dan spasi"),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{6,19}$/, "Format internasional, contoh: +6282218458888"),
  positionId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  employmentType: z.enum(["tetap", "kontrak", "magang"]),
  gender: z.enum(["pria", "wanita"]).optional(),
  birthDate: z.string().optional(),
  birthKabupatenId: z.number().int().positive().optional(),
  maritalStatus: z.enum(["kawin", "tidak_kawin"]).optional(),
  childrenCount: z.number().int().min(0).max(99).optional(),
  joinDate: z.string(),
  addressKelurahanId: z.number().int().positive().optional(),
  addressDetail: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  educations: z
    .array(
      z.object({
        level: z.string().min(1),
        institution: z.string().min(1),
        major: z.string().optional(),
        yearStart: z.number().int().optional(),
        yearEnd: z.number().int().optional(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;

  const nipExists = await db("employees").where({ nip: d.nip }).whereNull("deleted_at").first();
  if (nipExists) return NextResponse.json({ error: "NIP sudah digunakan" }, { status: 409 });

  const emailExists = await db("employees").where({ email: d.email }).whereNull("deleted_at").first();
  if (emailExists) return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });

  const [emp] = await db("employees")
    .insert({
      nip: d.nip,
      full_name: d.fullName,
      email: d.email,
      phone: d.phone,
      position_id: d.positionId,
      department_id: d.departmentId,
      employment_type: d.employmentType,
      gender: d.gender ?? null,
      birth_date: d.birthDate ?? null,
      birth_kabupaten_id: d.birthKabupatenId ?? null,
      marital_status: d.maritalStatus ?? null,
      children_count: d.childrenCount ?? 0,
      join_date: d.joinDate,
      address_kelurahan_id: d.addressKelurahanId ?? null,
      address_detail: d.addressDetail ?? null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
    })
    .returning("id");

  if (d.educations && d.educations.length > 0) {
    await db("employee_educations").insert(
      d.educations.map((e, i) => ({
        employee_id: emp.id,
        level: e.level,
        institution: e.institution,
        major: e.major ?? null,
        year_start: e.yearStart ?? null,
        year_end: e.yearEnd ?? null,
        sort_order: i,
      }))
    );
  }

  await logActivity({
    userId: user.userId,
    action: "CREATE_EMPLOYEE",
    module: "employees",
    description: `Tambah pegawai: ${d.fullName} (${d.nip})`,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  return NextResponse.json({ id: emp.id, message: "Pegawai berhasil ditambahkan" }, { status: 201 });
}
