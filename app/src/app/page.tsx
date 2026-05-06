import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";

// Landing page sederhana mengikuti DESIGN.md:
// premium white space, hierarchy bertahap, monokrom dengan satu accent.
export default function Home() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #fbfbfd 0%, #ffffff 100%)",
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: "center", py: { xs: 10, md: 16 } }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 4 }}>
          JMC INDONESIA
        </Typography>
        <Typography variant="h2" sx={{ mt: 2, mb: 3 }}>
          Sistem Pengelolaan Pegawai
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 6, maxWidth: 600, mx: "auto" }}>
          Modul terpadu untuk data pegawai, presensi, tunjangan, dan audit log.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Button component={Link} href="/login" variant="contained" size="large">
            Masuk
          </Button>
          <Button component={Link} href="/api/docs" variant="outlined" size="large" color="secondary">
            API Docs
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
