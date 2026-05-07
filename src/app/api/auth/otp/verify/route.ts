import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";
import { createSession, COOKIE_NAME } from "@/lib/session";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  userId: z.number().int().positive(),
  otp: z.string().length(6),
  rememberMe: z.boolean().optional().default(false),
});

const SESSION_8H = 60 * 60 * 8;
const SESSION_30D = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
  }

  const { userId, otp, rememberMe } = parsed.data;

  const otpResult = await verifyOtp(userId, otp);
  if (otpResult === "exceeded") {
    return NextResponse.json({ error: "Terlalu banyak percobaan OTP. Silakan login ulang." }, { status: 429 });
  }
  if (!otpResult) {
    return NextResponse.json({ error: "OTP salah atau kadaluarsa" }, { status: 401 });
  }

  const user = await db("users")
    .join("roles", "users.role_id", "roles.id")
    .where("users.id", userId)
    .where("users.is_active", true)
    .whereNull("users.deleted_at")
    .select("users.id", "users.username", "roles.name as role")
    .first();

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan atau tidak aktif" }, { status: 403 });
  }

  const token = await createSession({ userId: user.id, role: user.role, username: user.username }, rememberMe);

  await logActivity({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    module: "auth",
    description: `Login berhasil: ${user.username}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
  });

  const maxAge = rememberMe ? SESSION_30D : SESSION_8H;
  const res = NextResponse.json({ message: "Login berhasil", role: user.role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });
  return res;
}
