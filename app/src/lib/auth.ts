// Helper untuk digunakan di API route handlers (bukan edge middleware)
import { NextRequest } from "next/server";
import { getSession, COOKIE_NAME } from "./session";

export type AuthUser = {
  userId: number;
  username: string;
  role: string;
};

export async function requireAuth(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSession(token);
}

export function requireRole(user: AuthUser | null, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
