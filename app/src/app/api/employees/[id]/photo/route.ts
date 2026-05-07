import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "photos");

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "superadmin", "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const id = Number(params.id);
  const emp = await db("employees").where({ id }).whereNull("deleted_at").first();
  if (!emp) return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Format file tidak didukung (jpg/png/webp)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File terlalu besar (maks 2MB)" }, { status: 400 });
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const publicPath = `/uploads/photos/${filename}`;
  await db("employees").where({ id }).update({ photo_path: publicPath, updated_at: new Date() });

  return NextResponse.json({ photoPath: publicPath });
}
