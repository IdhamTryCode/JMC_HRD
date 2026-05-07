import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/wilayah?type=provinsi
// GET /api/wilayah?type=kabupaten&provinsiId=x
// GET /api/wilayah?type=kecamatan&kabupatenId=x
// GET /api/wilayah?type=kelurahan&kecamatanId=x
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");

  if (type === "provinsi") {
    const rows = await db("provinsi").select("id", "name").orderBy("name");
    return NextResponse.json(rows);
  }

  if (type === "kabupaten") {
    const provinsiId = searchParams.get("provinsiId");
    if (!provinsiId) return NextResponse.json({ error: "provinsiId diperlukan" }, { status: 400 });
    const rows = await db("kabupaten")
      .where({ provinsi_id: provinsiId })
      .select("id", "name")
      .orderBy("name");
    return NextResponse.json(rows);
  }

  if (type === "kecamatan") {
    const kabupatenId = searchParams.get("kabupatenId");
    if (!kabupatenId) return NextResponse.json({ error: "kabupatenId diperlukan" }, { status: 400 });
    const rows = await db("kecamatan")
      .join("kabupaten", "kecamatan.kabupaten_id", "kabupaten.id")
      .where({ "kecamatan.kabupaten_id": kabupatenId })
      .select("kecamatan.id", "kecamatan.name", "kabupaten.name as kabupaten")
      .orderBy("kecamatan.name");
    return NextResponse.json(rows);
  }

  if (type === "kelurahan") {
    const kecamatanId = searchParams.get("kecamatanId");
    if (!kecamatanId) return NextResponse.json({ error: "kecamatanId diperlukan" }, { status: 400 });
    const rows = await db("kelurahan")
      .where({ kecamatan_id: kecamatanId })
      .select("id", "name")
      .orderBy("name");
    // BIGINT dikembalikan pg driver sebagai string — konversi ke number
    return NextResponse.json(rows.map((r) => ({ ...r, id: Number(r.id) })));
  }

  return NextResponse.json({ error: "type tidak valid" }, { status: 400 });
}
