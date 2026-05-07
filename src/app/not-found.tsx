"use client";

import { Box, Typography, Button } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { D } from "@/lib/design-tokens";

export default function NotFoundPage() {
  const router = useRouter();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: D.canvasParchment,
        px: 2,
      }}
    >
      <Box sx={{ textAlign: "center", maxWidth: 420 }}>
        <Image src="/images/logo.png" alt="JMC" width={52} height={52} style={{ borderRadius: 12, marginBottom: 24 }} />
        <Typography
          sx={{ fontSize: 80, fontWeight: 700, letterSpacing: "-0.04em", color: D.ink, lineHeight: 1 }}
        >
          404
        </Typography>
        <Typography
          sx={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.011em", color: D.ink, mt: 1, mb: 1 }}
        >
          Halaman Tidak Ditemukan
        </Typography>
        <Typography sx={{ fontSize: 14, color: D.inkMuted48, mb: 3 }}>
          Halaman yang Anda cari tidak tersedia atau mungkin sudah dipindahkan.
          Pastikan URL yang Anda masukkan sudah benar.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
          <Button variant="outlined" onClick={() => router.back()}>
            Kembali
          </Button>
          <Button variant="contained" onClick={() => router.push("/dashboard")}>
            Ke Dashboard
          </Button>
        </Box>
        <Typography sx={{ fontSize: 11, color: D.inkMuted48, mt: 4 }}>
          JMC Indonesia · HRD System
        </Typography>
      </Box>
    </Box>
  );
}
