import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const [positions, departments] = await Promise.all([
    db("positions").select("id", "name").orderBy("name"),
    db("departments").select("id", "name").orderBy("name"),
  ]);

  return NextResponse.json({ positions, departments });
}
