"use client";

import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Tooltip, Avatar,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import ArticleIcon from "@mui/icons-material/Article";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LogoutIcon from "@mui/icons-material/Logout";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { D } from "@/lib/design-tokens";

const SIDEBAR_W = 220;

type NavItem = { label: string; href: string; icon: React.ReactNode; roles: string[] };

const NAV: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",           icon: <DashboardIcon fontSize="small" />,    roles: ["superadmin", "admin_hrd", "manager_hrd"] },
  { label: "Pengguna",      href: "/users",               icon: <PersonIcon fontSize="small" />,       roles: ["superadmin", "manager_hrd"] },
  { label: "Pegawai",       href: "/employees",           icon: <PeopleIcon fontSize="small" />,       roles: ["superadmin", "admin_hrd"] },
  { label: "Presensi",      href: "/attendances",         icon: <AccessTimeIcon fontSize="small" />,   roles: ["superadmin", "admin_hrd", "manager_hrd"] },
  { label: "Tunjangan",     href: "/transport-allowances",icon: <DirectionsCarIcon fontSize="small" />,roles: ["admin_hrd", "manager_hrd"] },
  { label: "Kuota Cuti",    href: "/leave-quotas",        icon: <EventNoteIcon fontSize="small" />,    roles: ["superadmin", "admin_hrd"] },
  { label: "Log Aktivitas", href: "/logs",                icon: <HistoryIcon fontSize="small" />,      roles: ["superadmin", "manager_hrd"] },
  { label: "API Docs",     href: "/docs",               icon: <ArticleIcon fontSize="small" />,      roles: ["superadmin"] },
];

type SessionInfo = { username: string; role: string; fullName: string | null };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSession)
      .catch(() => null);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const visibleNav = NAV.filter((n) => !session || n.roles.includes(session.role));

  const dashboardHref =
    session?.role === "superadmin" ? "/dashboard/superadmin" :
    session?.role === "manager_hrd" ? "/dashboard/manager" : "/dashboard/admin";

  const roleLabel: Record<string, string> = {
    superadmin: "Superadmin",
    manager_hrd: "Manager HRD",
    admin_hrd: "Admin HRD",
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>

      {/* ── Sidebar ── */}
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_W,
          flexShrink: 0,
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: D.canvas,
          borderRight: `1px solid ${D.hairline}`,
          zIndex: 1200,
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            cursor: "pointer",
            borderBottom: `1px solid ${D.hairline}`,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
          onClick={() => router.push(dashboardHref)}
        >
          <Image src="/images/logo.png" alt="JMC" width={28} height={28} style={{ borderRadius: 6 }} />
          <Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: D.inkMuted48,
                lineHeight: 1.2,
              }}
            >
              JMC Indonesia
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: D.ink,
                letterSpacing: "-0.011em",
                lineHeight: 1.2,
              }}
            >
              HRD System
            </Typography>
          </Box>
        </Box>

        {/* Nav items */}
        <Box sx={{ flex: 1, overflow: "auto", py: 1.5, px: 1 }}>
          <List dense disablePadding>
            {visibleNav.map((item) => {
              const href = item.href === "/dashboard" ? dashboardHref : item.href;
              const active = pathname.startsWith(item.href);
              return (
                <ListItem key={item.href} disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton
                    selected={active}
                    onClick={() => router.push(href)}
                    sx={{
                      borderRadius: "9px",
                      py: 0.9,
                      px: 1.5,
                      color: active ? D.primary : D.inkMuted48,
                      bgcolor: active ? "rgba(0,102,204,0.07)" : "transparent",
                      "&:hover": {
                        bgcolor: active ? "rgba(0,102,204,0.10)" : "rgba(0,0,0,0.04)",
                        color: active ? D.primary : D.ink,
                      },
                      "&.Mui-selected": {
                        bgcolor: "rgba(0,102,204,0.07)",
                        "&:hover": { bgcolor: "rgba(0,102,204,0.10)" },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? D.primary : D.inkMuted48,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        letterSpacing: "-0.007em",
                      }}
                    />
                    {active && (
                      <Box
                        sx={{
                          width: 3,
                          height: 16,
                          borderRadius: 9999,
                          bgcolor: D.primary,
                          ml: 0.5,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* User info + logout */}
        {session && (
          <Box
            sx={{
              borderTop: `1px solid ${D.hairline}`,
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: D.primary,
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {session.username[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: D.ink,
                  letterSpacing: "-0.007em",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {session.username}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: D.inkMuted48,
                  letterSpacing: "0.02em",
                  lineHeight: 1.3,
                }}
              >
                {roleLabel[session.role] ?? session.role}
              </Typography>
            </Box>
            <Tooltip title="Logout" placement="right">
              <IconButton
                onClick={handleLogout}
                size="small"
                sx={{
                  color: D.inkMuted48,
                  "&:hover": { color: D.ink, bgcolor: "rgba(0,0,0,0.05)" },
                  flexShrink: 0,
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* ── Main content ── */}
      <Box
        component="main"
        sx={{
          ml: `${SIDEBAR_W}px`,
          flex: 1,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1100,
            height: 52,
            px: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px) saturate(180%)",
            borderBottom: `1px solid ${D.hairline}`,
          }}
        >
          {/* Breadcrumb / page title area */}
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: D.inkMuted48,
              letterSpacing: "-0.007em",
            }}
          >
            {pathname.split("/").filter(Boolean).map((s) =>
              s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")
            ).join(" › ")}
          </Typography>

          {session && (
            <Tooltip title="Profil saya" placement="left">
              <Box
                onClick={() => router.push("/profile")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 9999,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.05)" },
                }}
              >
                <Typography sx={{ fontSize: 12, color: D.inkMuted48 }}>
                  {session.username}
                </Typography>
                <Avatar sx={{ width: 26, height: 26, bgcolor: D.primary, fontSize: 11, fontWeight: 600 }}>
                  {session.username[0]?.toUpperCase()}
                </Avatar>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Page content */}
        <Box sx={{ flex: 1, overflow: "auto", p: 3, display: "flex", flexDirection: "column" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
