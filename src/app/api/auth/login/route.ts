import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { verifyCaptcha } from "@/lib/captcha";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { logActivity } from "@/lib/activity";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 10; // 10 menit

const schema = z.object({
  username: z.string().min(1), // bisa username, email, atau no HP
  password: z.string().min(1),
  captchaId: z.string().uuid(),
  captchaAnswer: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
  }

  const { username, password, captchaId, captchaAnswer } = parsed.data;

  // Rate limiting: max 5 login attempt per IP per 10 menit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const rateLimitKey = `rate_limit:login:${ip}`;
  const attempts = await redis.incr(rateLimitKey);
  if (attempts === 1) await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
  if (attempts > RATE_LIMIT_MAX) {
    const ttl = await redis.ttl(rateLimitKey);
    return NextResponse.json(
      { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(ttl / 60)} menit.` },
      { status: 429 }
    );
  }

  const captchaOk = await verifyCaptcha(captchaId, captchaAnswer);
  if (!captchaOk) {
    return NextResponse.json({ error: "Captcha salah atau kadaluarsa" }, { status: 400 });
  }

  // Support login via username, email, atau no HP
  const user = await db("users")
    .join("roles", "users.role_id", "roles.id")
    .leftJoin("employees", "users.employee_id", "employees.id")
    .where((q) =>
      q
        .where("users.username", username)
        .orWhere("users.email", username)
        .orWhere("employees.email", username)
        .orWhere("employees.phone", username)
    )
    .whereNull("users.deleted_at")
    .select(
      "users.id",
      "users.username",
      "users.password_hash",
      "users.is_active",
      "roles.name as role",
      db.raw("COALESCE(users.email, employees.email) as email")
    )
    .first();

  const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  if (!user) {
    await logActivity({
      userId: null,
      action: "LOGIN_FAILED",
      module: "auth",
      description: `Login gagal: username tidak ditemukan (${username})`,
      ipAddress,
    });
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  if (!user.is_active) {
    await logActivity({
      userId: user.id,
      action: "LOGIN_FAILED",
      module: "auth",
      description: `Login gagal: akun tidak aktif (${username})`,
      ipAddress,
    });
    return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
  }

  const passwordOk = await argon2.verify(user.password_hash, password);
  if (!passwordOk) {
    await logActivity({
      userId: user.id,
      action: "LOGIN_FAILED",
      module: "auth",
      description: `Login gagal: password salah (${username})`,
      ipAddress,
    });
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  // kirim OTP
  const otp = await createOtp(user.id);
  await sendOtpEmail(user.email, otp);

  await logActivity({
    userId: user.id,
    action: "LOGIN_ATTEMPT",
    module: "auth",
    description: `Login attempt oleh ${username}`,
    ipAddress,
  });

  return NextResponse.json({ message: "OTP telah dikirim ke email Anda", userId: user.id });
}
