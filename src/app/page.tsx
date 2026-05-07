import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Image from "next/image";
import Link from "next/link";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EventNoteIcon from "@mui/icons-material/EventNote";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import LockIcon from "@mui/icons-material/Lock";
import StorageIcon from "@mui/icons-material/Storage";
import { D } from "@/lib/design-tokens";

const MODULES = [
  { icon: <PeopleIcon />, title: "Data Pegawai", desc: "CRUD lengkap dengan foto, riwayat pendidikan, alamat domisili, dan ekspor PDF/Excel." },
  { icon: <AccessTimeIcon />, title: "Presensi", desc: "Input manual & impor Excel via background queue. Verifikasi berjenjang lead → manager → HRD." },
  { icon: <DirectionsCarIcon />, title: "Tunjangan Transport", desc: "Kalkulasi otomatis berbasis Haversine dari koordinat domisili pegawai ke kantor." },
  { icon: <EventNoteIcon />, title: "Kuota Cuti & Izin", desc: "Pengelolaan kuota tahunan per pegawai dengan upsert per periode." },
  { icon: <DashboardIcon />, title: "Dashboard & Peta", desc: "Statistik real-time, grafik tren kehadiran, dan peta sebaran domisili pegawai." },
  { icon: <HistoryIcon />, title: "Audit Log", desc: "Jejak aktivitas semua aksi penting dengan filter modul, tanggal, dan pengguna." },
];

const STACK_ITEMS = [
  "Next.js 14",
  "TypeScript",
  "PostgreSQL 16",
  "Knex 3",
  "Redis",
  "BullMQ",
  "MUI v5",
  "Argon2",
];

export default function Home() {
  return (
    <Box component="main" sx={{ bgcolor: D.canvas }}>
      {/* Top bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: `1px solid ${D.hairline}`,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Image src="/images/logo.png" alt="JMC" width={26} height={26} style={{ borderRadius: 6 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: D.ink, letterSpacing: "-0.011em" }}>
                JMC HRD System
              </Typography>
            </Box>
            <Button component={Link} href="/login" variant="contained" size="small">
              Masuk
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #fbfbfd 0%, #ffffff 100%)",
          borderBottom: `1px solid ${D.hairline}`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 800px 400px at 50% -10%, rgba(0,102,204,0.08), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="md" sx={{ position: "relative", py: { xs: 10, md: 16 }, textAlign: "center" }}>
          <Box sx={{ display: "inline-flex", mb: 4 }}>
            <Image src="/images/logo.png" alt="JMC Indonesia" width={64} height={64} style={{ borderRadius: 14 }} priority />
          </Box>
          <Typography
            variant="overline"
            sx={{ display: "block", color: D.inkMuted48, letterSpacing: "0.18em", mb: 2 }}
          >
            JMC INDONESIA
          </Typography>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: 36, sm: 48, md: 56 }, lineHeight: 1.05, mb: 3, color: D.ink }}
          >
            Sistem Pengelolaan
            <br />
            <Box component="span" sx={{ color: D.primary }}>
              Sumber Daya Manusia
            </Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 400, color: D.inkMuted48, maxWidth: 620, mx: "auto", mb: 6, letterSpacing: "-0.011em" }}
          >
            Platform terpadu untuk pegawai, presensi, tunjangan transport, kuota cuti,
            dashboard, dan audit log — dirancang dengan pendekatan minimalis dan keamanan baseline modern.
          </Typography>
          <Button component={Link} href="/login" variant="contained" size="large">
            Mulai Masuk
          </Button>
        </Container>
      </Box>

      {/* Modules grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 14 } }}>
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography variant="overline" sx={{ color: D.primary, letterSpacing: "0.18em" }}>
            MODUL APLIKASI
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 34 }, mt: 1, mb: 2 }}>
            Semua kebutuhan HRD dalam satu platform
          </Typography>
          <Typography sx={{ color: D.inkMuted48, maxWidth: 560, mx: "auto", fontSize: 15, lineHeight: 1.5 }}>
            Sembilan modul fungsional yang saling terintegrasi, dari autentikasi hingga audit trail.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {MODULES.map((m) => (
            <Grid key={m.title} item xs={12} sm={6} md={4}>
              <Box
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${D.hairline}`,
                  bgcolor: D.canvas,
                  transition: "border-color 0.2s, transform 0.2s",
                  "&:hover": {
                    borderColor: D.primary,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "rgba(0,102,204,0.08)",
                    color: D.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  {m.icon}
                </Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: D.ink, mb: 0.75, letterSpacing: "-0.011em" }}>
                  {m.title}
                </Typography>
                <Typography sx={{ fontSize: 13, color: D.inkMuted48, lineHeight: 1.55 }}>
                  {m.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Tech stack & security */}
      <Box sx={{ bgcolor: D.canvasParchment, borderTop: `1px solid ${D.hairline}`, borderBottom: `1px solid ${D.hairline}` }}>
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="overline" sx={{ color: D.primary, letterSpacing: "0.18em" }}>
                TEKNOLOGI
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 28 }, mt: 1, mb: 2 }}>
                Dibangun di atas stack modern
              </Typography>
              <Typography sx={{ color: D.inkMuted48, fontSize: 15, lineHeight: 1.55, mb: 3 }}>
                Next.js App Router untuk fullstack TypeScript, PostgreSQL dengan raw SQL via Knex,
                Redis untuk session & queue, dan kontainerisasi penuh via Docker Compose.
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {STACK_ITEMS.map((item) => (
                  <Box
                    key={item}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 9999,
                      bgcolor: D.canvas,
                      border: `1px solid ${D.hairline}`,
                      fontSize: 12,
                      fontWeight: 500,
                      color: D.ink,
                    }}
                  >
                    {item}
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2.5}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: D.canvas,
                      border: `1px solid ${D.hairline}`,
                      color: D.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LockIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: D.ink, mb: 0.25 }}>
                      Keamanan baseline
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: D.inkMuted48, lineHeight: 1.5 }}>
                      Argon2id password hashing, OTP via email, captcha, rate limiting, RBAC
                      per route, dan session token disimpan sebagai hash.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: D.canvas,
                      border: `1px solid ${D.hairline}`,
                      color: D.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <StorageIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: D.ink, mb: 0.25 }}>
                      Data layer eksplisit
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: D.inkMuted48, lineHeight: 1.5 }}>
                      Raw SQL via Knex 3 — bukan ORM. Migrasi dan seed dikelola sebagai kode,
                      reproducible dari nol via Docker Compose.
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Container maxWidth="md" sx={{ py: { xs: 10, md: 14 }, textAlign: "center" }}>
        <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 36 }, mb: 2 }}>
          Siap untuk mulai?
        </Typography>
        <Typography sx={{ color: D.inkMuted48, fontSize: 15, mb: 5, maxWidth: 480, mx: "auto" }}>
          Masuk dengan akun yang telah disediakan administrator.
        </Typography>
        <Button component={Link} href="/login" variant="contained" size="large">
          Masuk
        </Button>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: `1px solid ${D.hairline}`, py: 4, bgcolor: D.canvas }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Image src="/images/logo.png" alt="JMC" width={20} height={20} style={{ borderRadius: 4 }} />
              <Typography sx={{ fontSize: 12, color: D.inkMuted48 }}>
                © {new Date().getFullYear()} JMC Indonesia · HRD System
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 12, color: D.inkMuted48 }}>
              Programmer Middle Technical Test
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
