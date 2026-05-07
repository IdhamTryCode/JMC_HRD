import crypto from "node:crypto";
import { db } from "./db";

const OTP_TTL_SECONDS = 60;
const OTP_PURPOSE = "login";

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function createOtp(userId: number): Promise<string> {
  const otp = generateOtp();
  const hash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  // invalidate OTP lama yang belum dikonsumsi
  await db("otp_tokens")
    .where({ user_id: userId, purpose: OTP_PURPOSE })
    .whereNull("consumed_at")
    .delete();

  await db("otp_tokens").insert({
    user_id: userId,
    code_hash: hash,
    purpose: OTP_PURPOSE,
    expires_at: expiresAt,
  });

  return otp;
}

const OTP_MAX_ATTEMPTS = 5;

export async function verifyOtp(userId: number, otp: string): Promise<boolean | "exceeded"> {
  // Cari token aktif milik user (belum expired, belum dikonsumsi)
  const token = await db("otp_tokens")
    .where({ user_id: userId, purpose: OTP_PURPOSE })
    .whereNull("consumed_at")
    .where("expires_at", ">", new Date())
    .first();

  if (!token) return false;

  // Cek apakah sudah melebihi batas percobaan
  if (token.attempts >= OTP_MAX_ATTEMPTS) {
    return "exceeded";
  }

  // Increment attempts terlebih dahulu
  await db("otp_tokens").where({ id: token.id }).increment("attempts", 1);

  const hash = hashOtp(otp);
  if (token.code_hash !== hash) return false;

  await db("otp_tokens").where({ id: token.id }).update({ consumed_at: new Date() });
  return true;
}
