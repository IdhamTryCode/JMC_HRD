import { NextRequest, NextResponse } from "next/server";
import { revokeSession, COOKIE_NAME } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (token) {
    const session = await getSession(token);
    if (session) {
      await logActivity({
        userId: session.userId,
        action: "LOGOUT",
        module: "auth",
        description: `Logout: ${session.username}`,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      });
    }
    await revokeSession(token);
  }

  const res = NextResponse.json({ message: "Logout berhasil" });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
