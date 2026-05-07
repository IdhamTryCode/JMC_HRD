"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Divider } from "@mui/material";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { D } from "@/lib/design-tokens";

export default function AdminDashboard() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setName(d?.fullName ?? d?.username ?? null))
      .catch(() => null);
  }, []);

  return (
    <AppShell>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Hero card */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            p: 3,
            borderRadius: "18px",
            bgcolor: D.canvas,
            border: `1px solid ${D.hairline}`,
            maxWidth: 560,
          }}
        >
          <Image src="/images/logo.png" alt="JMC" width={56} height={56} style={{ borderRadius: 14 }} />
          <Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: D.inkMuted48,
                mb: 0.5,
              }}
            >
              JMC Indonesia · HRD System
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2, color: D.ink }}
            >
              {name
                ? `Selamat Datang ${name} - Admin HRD`
                : "Selamat Datang - Admin HRD"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: "auto", pt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography sx={{ fontSize: 12, color: D.inkMuted48 }}>
            © {new Date().getFullYear()} JMC Indonesia. Sistem internal — hanya untuk penggunaan resmi.
          </Typography>
        </Box>
      </Box>
    </AppShell>
  );
}
