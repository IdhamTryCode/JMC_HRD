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
    const search = searchParams.get("search");
    // Search lintas-provinsi (untuk autosuggest tempat lahir): butuh min 2 karakter
    if (search) {
      if (search.length < 2) return NextResponse.json([]);
      const rows = await db("kabupaten")
        .join("provinsi", "kabupaten.provinsi_id", "provinsi.id")
        .whereILike("kabupaten.name", `%${search}%`)
        .select("kabupaten.id", "kabupaten.name", "provinsi.name as provinsi")
        .orderBy("kabupaten.name")
        .limit(20);
      return NextResponse.json(rows);
    }
    if (!provinsiId) return NextResponse.json({ error: "provinsiId atau search diperlukan" }, { status: 400 });
    const rows = await db("kabupaten")
      .where({ provinsi_id: provinsiId })
      .select("id", "name")
      .orderBy("name");
    return NextResponse.json(rows);
  }

  if (type === "kecamatan") {
    const kabupatenId = searchParams.get("kabupatenId");
    const search = searchParams.get("search");
    // Search lintas-kabupaten (untuk autosuggest alamat domisili): butuh min 2 karakter
    if (search) {
      if (search.length < 2) return NextResponse.json([]);
      const rows = await db("kecamatan")
        .join("kabupaten", "kecamatan.kabupaten_id", "kabupaten.id")
        .join("provinsi", "kabupaten.provinsi_id", "provinsi.id")
        .whereILike("kecamatan.name", `%${search}%`)
        .select(
          "kecamatan.id",
          "kecamatan.name",
          "kabupaten.id as kabupaten_id",
          "kabupaten.name as kabupaten",
          "provinsi.id as provinsi_id",
          "provinsi.name as provinsi"
        )
        .orderBy("kecamatan.name")
        .limit(30);
      return NextResponse.json(rows);
    }
    if (!kabupatenId) return NextResponse.json({ error: "kabupatenId atau search diperlukan" }, { status: 400 });
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
