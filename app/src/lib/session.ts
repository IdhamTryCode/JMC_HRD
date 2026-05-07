import crypto from "node:crypto";
import { redis } from "./redis";
import { db } from "./db";
import { COOKIE_NAME } from "./constants";

export { COOKIE_NAME };

const SESSION_TTL_DEFAULT = 60 * 60 * 8; // 8 jam
const SESSION_TTL_REMEMBER = 60 * 60 * 24 * 30; // 30 hari

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

type SessionPayload = {
  userId: number;
  role: string;
  username: string;
};

export async function createSession(payload: SessionPayload, rememberMe = false): Promise<string> {
  const token = generateToken();
  const hash = hashToken(token);
  const ttl = rememberMe ? SESSION_TTL_REMEMBER : SESSION_TTL_DEFAULT;

  await db("user_sessions").insert({
    user_id: payload.userId,
    token_hash: hash,
    expires_at: new Date(Date.now() + ttl * 1000),
  });

  // simpan di Redis untuk fast lookup saat force-logout
  await redis.set(`session:${hash}`, JSON.stringify(payload), "EX", ttl);

  return token;
}

export async function getSession(token: string): Promise<SessionPayload | null> {
  const hash = hashToken(token);
  const raw = await redis.get(`session:${hash}`);
  if (raw) return JSON.parse(raw) as SessionPayload;

  // fallback ke DB kalau Redis miss
  const row = await db("user_sessions")
    .where({ token_hash: hash })
    .whereNull("revoked_at")
    .where("expires_at", ">", new Date())
    .first();
  if (!row) return null;

  const user = await db("users")
    .join("roles", "users.role_id", "roles.id")
    .where("users.id", row.user_id)
    .select("users.id", "users.username", "roles.name as role")
    .first();
  if (!user) return null;

  const payload: SessionPayload = { userId: user.id, role: user.role, username: user.username };
  await redis.set(`session:${hash}`, JSON.stringify(payload), "EX", SESSION_TTL_DEFAULT);
  return payload;
}

export async function revokeSession(token: string): Promise<void> {
  const hash = hashToken(token);
  await redis.del(`session:${hash}`);
  await db("user_sessions").where({ token_hash: hash }).update({ revoked_at: new Date() });
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  const rows = await db("user_sessions")
    .where({ user_id: userId })
    .whereNull("revoked_at")
    .select("token_hash");
  const pipe = redis.pipeline();
  for (const row of rows) {
    pipe.del(`session:${row.token_hash}`);
  }
  await pipe.exec();
  await db("user_sessions")
    .where({ user_id: userId })
    .whereNull("revoked_at")
    .update({ revoked_at: new Date() });
}
