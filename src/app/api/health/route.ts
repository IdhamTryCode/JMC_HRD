import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.raw("SELECT 1");
    return NextResponse.json({ status: "ok", db: "up", time: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { status: "degraded", db: "down", error: (e as Error).message },
      { status: 503 }
    );
  }
}
