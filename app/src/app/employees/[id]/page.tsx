"use client";

import { useEffect, useState } from "react";
import {
  Box, Typography, Chip, Grid, Card, CardContent,
  Button, Avatar, Divider, CircularProgress, Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useRouter, useParams } from "next/navigation";
import AppShell from "@/components/AppShell";

type Education = {
  id: number; level: string; institution: string;
  major: string | null; year_start: number | null; year_end: number | null;
};

type EmpDetail = {
  id: number; nip: string; full_name: string; email: string; phone: string;
  employment_type: string; gender: string | null; birth_date: string | null;
  marital_status: string | null; children_count: number; join_date: string;
  address_detail: string | null; is_active: boolean; photo_path: string | null;
  position_name: string; department_name: string;
  kelurahan_name: string | null; kecamatan_name: string | null;
  kabupaten_name: string | null; provinsi_name: string | null;
  masa_kerja_tahun: number;
  educations: Education[];
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value ?? "—"}</Typography>
    </Box>
  );
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [emp, setEmp] = useState<EmpDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/employees/${params.id}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Tidak ditemukan"))
      .then(setEmp)
      .catch(() => setError("Pegawai tidak ditemukan"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <AppShell><CircularProgress /></AppShell>;
  if (error || !emp) return <AppShell><Alert severity="error">{error || "Tidak ditemukan"}</Alert></AppShell>;

  const alamat = [emp.address_detail, emp.kelurahan_name, emp.kecamatan_name, emp.kabupaten_name, emp.provinsi_name]
    .filter(Boolean).join(", ") || "—";

  return (
    <AppShell>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Avatar src={emp.photo_path ?? undefined} sx={{ width: 72, height: 72, fontSize: 28 }}>
            {emp.full_name[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{emp.full_name}</Typography>
            <Typography color="text.secondary">{emp.nip} · {emp.position_name} · {emp.department_name}</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Chip label={emp.employment_type} size="small" color="primary" />
              <Chip label={emp.is_active ? "Aktif" : "Nonaktif"} size="small" color={emp.is_active ? "success" : "default"} />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => window.open(`/api/employees/${emp.id}/pdf`, "_blank")}>
            PDF
          </Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => router.push(`/employees/${emp.id}/edit`)}>
            Edit
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Data Diri</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><Field label="Email" value={emp.email} /></Grid>
                <Grid item xs={6}><Field label="No. HP" value={emp.phone} /></Grid>
                <Grid item xs={6}><Field label="Gender" value={emp.gender === "pria" ? "Laki-laki" : emp.gender === "wanita" ? "Perempuan" : null} /></Grid>
                <Grid item xs={6}><Field label="Tanggal Lahir" value={emp.birth_date} /></Grid>
                <Grid item xs={6}><Field label="Status Nikah" value={emp.marital_status === "kawin" ? "Kawin" : emp.marital_status === "tidak_kawin" ? "Tidak Kawin" : null} /></Grid>
                <Grid item xs={6}><Field label="Jumlah Anak" value={emp.children_count} /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Kepegawaian</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><Field label="Tanggal Bergabung" value={emp.join_date} /></Grid>
                <Grid item xs={6}><Field label="Masa Kerja" value={`${emp.masa_kerja_tahun} tahun`} /></Grid>
                <Grid item xs={12}><Field label="Alamat" value={alamat} /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {emp.educations.length > 0 && (
          <Grid item xs={12}>
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Riwayat Pendidikan</Typography>
                {emp.educations.map((e, i) => (
                  <Box key={e.id}>
                    {i > 0 && <Divider sx={{ my: 1 }} />}
                    <Box sx={{ display: "flex", gap: 2, alignItems: "baseline" }}>
                      <Chip label={e.level} size="small" />
                      <Typography variant="body2" fontWeight={500}>{e.institution}</Typography>
                      {e.major && <Typography variant="body2" color="text.secondary">{e.major}</Typography>}
                      {e.year_start && <Typography variant="body2" color="text.secondary">{e.year_start}–{e.year_end ?? ""}</Typography>}
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </AppShell>
  );
}
