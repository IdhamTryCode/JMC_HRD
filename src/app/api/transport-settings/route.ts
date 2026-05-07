import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const rows = await db("transport_settings")
    .orderBy("effective_from", "desc")
    .limit(20)
    .select("*");

  return NextResponse.json({ data: rows });
}

const schema = z.object({
  baseFarePerKm: z.number().positive(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!requireRole(user, "admin_hrd")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db("transport_settings")
    .insert({
      base_fare_per_km: parsed.data.baseFarePerKm,
      effective_from: parsed.data.effectiveFrom,
      created_by: user.userId,
    })
    .returning("id");

  return NextResponse.json({ id: row.id, message: "Setting berhasil disimpan" }, { status: 201 });
}
