import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/constants";

// Route RBAC map: path prefix → allowed roles (empty = semua role authenticated)
const RBAC: Record<string, string[]> = {
  "/dashboard/superadmin": ["superadmin"],
  "/dashboard/admin": ["superadmin", "admin_hrd"],
  "/dashboard/manager": ["superadmin", "manager_hrd"],
  "/users": ["superadmin", "manager_hrd"],
  "/employees": ["superadmin", "admin_hrd"],
  "/attendances": ["superadmin", "admin_hrd", "manager_hrd"],
  "/transport-allowances": ["admin_hrd", "manager_hrd"],
  "/leave-quotas": ["superadmin", "admin_hrd"],
  "/logs": ["superadmin", "manager_hrd"],
  "/docs": ["superadmin"],
  "/profile": [],
};

// API route RBAC
const API_RBAC: Record<string, string[]> = {
  "/api/users": ["superadmin", "manager_hrd"],
  "/api/employees": ["superadmin", "admin_hrd"],
  "/api/attendances": ["superadmin", "admin_hrd", "manager_hrd"],
  "/api/transport-allowances": ["admin_hrd", "manager_hrd"],
  "/api/transport-settings": ["admin_hrd"],
  "/api/leave-quotas": ["superadmin", "admin_hrd", "manager_hrd"],
  "/api/logs": ["superadmin", "manager_hrd"],
};

// Public routes yang tidak perlu auth
const PUBLIC_PREFIXES = [
  "/api/auth/",
  "/api/health",
  "/api/docs",
  "/login",
  "/_next",
  "/favicon",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Hanya protect route tertentu
  const isProtectedPage = Object.keys(RBAC).some((p) => pathname.startsWith(p));
  const isProtectedApi = Object.keys(API_RBAC).some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Validasi session via internal API (edge-compatible: tidak bisa import db/redis langsung)
  const sessionRes = await fetch(new URL("/api/auth/session", req.url), {
    headers: { cookie: `${COOKIE_NAME}=${token}` },
  });

  if (!sessionRes.ok) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  }

  const { role } = await sessionRes.json();

  // cek RBAC
  const rbacMap = isProtectedApi ? API_RBAC : RBAC;
  const matchedPrefix = Object.keys(rbacMap).find((p) => pathname.startsWith(p));
  if (matchedPrefix) {
    const allowed = rbacMap[matchedPrefix];
    if (allowed.length > 0 && !allowed.includes(role)) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  // inject role ke header untuk digunakan di route handler
  const res = NextResponse.next();
  res.headers.set("x-user-role", role);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
