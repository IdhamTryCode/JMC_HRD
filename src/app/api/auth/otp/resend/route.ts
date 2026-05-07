import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// POST /api/auth/otp/resend — kirim ulang OTP untuk userId yang sama
// Hanya bisa digunakan saat OTP sudah expired (bukan saat masih aktif)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const userId = body?.userId;
  if (!userId || typeof userId !== "number") {
    return NextResponse.json({ error: "userId tidak valid" }, { status: 400 });
  }

  const user = await db("users")
    .join("roles", "users.role_id", "roles.id")
    .where("users.id", userId)
    .whereNull("users.deleted_at")
    .where("users.is_active", true)
    .select("users.id", "users.email", "users.username")
    .first();

  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  // Cek apakah masih ada OTP aktif (belum expired, belum dikonsumsi)
  const activeOtp = await db("otp_tokens")
    .where({ user_id: userId, purpose: "login" })
    .whereNull("consumed_at")
    .where("expires_at", ">", new Date())
    .first();

  if (activeOtp) {
    return NextResponse.json({ error: "OTP masih aktif, tunggu sebentar sebelum kirim ulang" }, { status: 429 });
  }

  const otp = await createOtp(userId);
  if (user.email) {
    await sendOtpEmail(user.email, otp);
  }

  return NextResponse.json({ message: "OTP baru telah dikirim ke email Anda" });
}
