import { NextRequest, NextResponse } from "next/server";
import { getSession, COOKIE_NAME } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const session = await getSession(token);
  if (!session) {
    return NextResponse.json({ error: "Session invalid or expired" }, { status: 401 });
  }

  const employee = await db("users")
    .leftJoin("employees", "users.employee_id", "employees.id")
    .where("users.id", session.userId)
    .select("employees.full_name")
    .first()
    .catch(() => null);

  return NextResponse.json({
    userId: session.userId,
    username: session.username,
    role: session.role,
    fullName: employee?.full_name ?? null,
  });
}
