"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Divider } from "@mui/material";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import ManagerDashboardContent from "@/components/ManagerDashboardContent";
import EmployeeMap from "@/components/EmployeeMap";
import { D } from "@/lib/design-tokens";

export default function ManagerDashboard() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setName(d?.fullName ?? d?.username ?? null))
      .catch(() => null);
  }, []);

  return (
    <AppShell>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Branding header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2.5,
            borderRadius: "18px",
            bgcolor: D.canvas,
            border: `1px solid ${D.hairline}`,
          }}
        >
          <Image src="/images/logo.png" alt="JMC" width={44} height={44} style={{ borderRadius: 11 }} />
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: D.inkMuted48, lineHeight: 1.2 }}>
              JMC Indonesia · HRD System
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: "-0.011em", lineHeight: 1.2, color: D.ink }}>
              {name ? `Selamat Datang, ${name} — Manager HRD` : "Selamat Datang — Manager HRD"}
            </Typography>
          </Box>
        </Box>

        {/* Widgets + charts + tabel */}
        <ManagerDashboardContent />

        {/* Peta domisili */}
        <Box
          sx={{
            borderRadius: "18px",
            bgcolor: D.canvas,
            border: `1px solid ${D.hairline}`,
            p: 2.5,
          }}
        >
          <Typography
            sx={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.007em", color: D.ink, mb: 1.5 }}
          >
            Peta Domisili Pegawai
          </Typography>
          <EmployeeMap showNearest />
        </Box>

        <Box>
          <Divider sx={{ mb: 2 }} />
          <Typography sx={{ fontSize: 12, color: D.inkMuted48 }}>
            © {new Date().getFullYear()} JMC Indonesia. Sistem internal — hanya untuk penggunaan resmi.
          </Typography>
        </Box>
      </Box>
    </AppShell>
  );
}
