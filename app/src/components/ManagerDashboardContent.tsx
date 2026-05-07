"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Box,
  Skeleton, Alert, Table, TableBody, TableCell,
  TableHead, TableRow, TableContainer, Chip,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import WorkIcon from "@mui/icons-material/Work";
import BadgeIcon from "@mui/icons-material/Badge";
import SchoolIcon from "@mui/icons-material/School";
import { D } from "@/lib/design-tokens";

type Stats = {
  employees: { total: number; active: number };
  empTypeBreakdown: { type: string; count: number }[];
  genderBreakdown: { gender: string; count: number }[];
  newestEmployees: {
    id: number; full_name: string; nip: string;
    employment_type: string; join_date: string;
    position_name: string | null; department_name: string | null;
  }[];
};

const EMP_COLORS: Record<string, string> = { tetap: "#1976d2", kontrak: "#9c27b0", magang: "#ed6c02" };
const EMP_LABEL: Record<string, string> = { tetap: "Tetap", kontrak: "Kontrak", magang: "Magang" };
const GENDER_COLORS: Record<string, string> = { pria: "#0288d1", wanita: "#d81b60" };

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: number; sub?: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <Card sx={{ borderRadius: "14px", border: `1px solid ${D.hairline}`, boxShadow: "none", flex: 1, minWidth: 0 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: "9px", bgcolor: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", color: accent, mb: 1.5 }}>
          {icon}
        </Box>
        <Typography sx={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: D.ink, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: 12, color: D.inkMuted48, mt: 0.25 }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: 11, color: D.inkMuted48 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function DoughnutChart({ data, colors, title }: {
  data: { label: string; value: number }[];
  colors: string[];
  title: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card sx={{ borderRadius: "14px", border: `1px solid ${D.hairline}`, boxShadow: "none", height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: D.inkMuted48, letterSpacing: "0.04em", textTransform: "uppercase", mb: 1.5 }}>
          {title}
        </Typography>
        {total === 0 ? (
          <Typography sx={{ fontSize: 13, color: D.inkMuted48 }}>Belum ada data</Typography>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            {/* CSS conic-gradient doughnut */}
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Box sx={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: (() => {
                  let c = 0;
                  return `conic-gradient(${data.map((d, i) => {
                    const pct = (d.value / total) * 100;
                    const seg = `${colors[i % colors.length]} ${c.toFixed(1)}% ${(c + pct).toFixed(1)}%`;
                    c += pct;
                    return seg;
                  }).join(", ")})`;
                })(),
              }} />
              <Box sx={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 50, height: 50, borderRadius: "50%",
                bgcolor: D.canvas,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: D.ink }}>{total}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {data.map((d, i) => (
                <Box key={d.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: colors[i % colors.length], flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 12, color: D.ink }}>
                    {d.label}: <strong>{d.value}</strong>{" "}
                    <span style={{ color: D.inkMuted48 }}>({((d.value / total) * 100).toFixed(0)}%)</span>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function ManagerDashboardContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject("Gagal")))
      .then(setStats)
      .catch(() => setError("Gagal memuat statistik"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: "14px" }} />
        ))}
      </Box>
    );
  }

  if (error || !stats) {
    return <Alert severity="error">{error || "Data tidak tersedia"}</Alert>;
  }

  const tetap  = stats.empTypeBreakdown.find((e) => e.type === "tetap")?.count  ?? 0;
  const kontrak = stats.empTypeBreakdown.find((e) => e.type === "kontrak")?.count ?? 0;
  const magang  = stats.empTypeBreakdown.find((e) => e.type === "magang")?.count  ?? 0;

  const empTypeChartData = stats.empTypeBreakdown.map((e) => ({ label: EMP_LABEL[e.type] ?? e.type, value: e.count }));
  const empTypeColors    = stats.empTypeBreakdown.map((e) => EMP_COLORS[e.type] ?? "#90a4ae");
  const genderChartData  = stats.genderBreakdown.map((g) => ({ label: g.gender === "pria" ? "Pria" : "Wanita", value: g.count }));
  const genderColors     = stats.genderBreakdown.map((g) => GENDER_COLORS[g.gender] ?? "#90a4ae");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* 4 Widget */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 2 }}>
        <StatCard label="Total Pegawai"    value={stats.employees.total} sub={`${stats.employees.active} aktif`} icon={<PeopleIcon />} accent={D.primary} />
        <StatCard label="Pegawai Kontrak"  value={kontrak}  icon={<BadgeIcon />}  accent="#9c27b0" />
        <StatCard label="Pegawai Tetap"    value={tetap}    icon={<WorkIcon />}   accent="#1976d2" />
        <StatCard label="Peserta Magang"   value={magang}   icon={<SchoolIcon />} accent="#ed6c02" />
      </Box>

      {/* 2 Doughnut Charts */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <DoughnutChart title="Komposisi Jenis Kepegawaian" data={empTypeChartData} colors={empTypeColors} />
        <DoughnutChart title="Rasio Gender" data={genderChartData} colors={genderColors} />
      </Box>

      {/* Tabel 5 Pegawai Terbaru */}
      <Card sx={{ borderRadius: "14px", border: `1px solid ${D.hairline}`, boxShadow: "none" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: D.inkMuted48, letterSpacing: "0.04em", textTransform: "uppercase", mb: 1.5 }}>
            5 Pegawai dengan Tanggal Masuk Paling Baru
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Nama", "NIP", "Jabatan", "Departemen", "Jenis", "Tgl Masuk"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: D.inkMuted48, letterSpacing: "0.04em", textTransform: "uppercase", borderColor: D.hairline }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.newestEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography sx={{ fontSize: 13, color: D.inkMuted48 }}>Belum ada data pegawai</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.newestEmployees.map((emp) => (
                    <TableRow key={emp.id} hover sx={{ "&:hover td": { bgcolor: D.canvasParchment } }}>
                      <TableCell sx={{ fontSize: 13, borderColor: D.hairline }}>{emp.full_name}</TableCell>
                      <TableCell sx={{ fontSize: 13, color: D.inkMuted48, borderColor: D.hairline }}>{emp.nip}</TableCell>
                      <TableCell sx={{ fontSize: 13, borderColor: D.hairline }}>{emp.position_name ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 13, borderColor: D.hairline }}>{emp.department_name ?? "—"}</TableCell>
                      <TableCell sx={{ borderColor: D.hairline }}>
                        <Chip
                          label={EMP_LABEL[emp.employment_type] ?? emp.employment_type}
                          size="small"
                          sx={{ bgcolor: EMP_COLORS[emp.employment_type] + "18", color: EMP_COLORS[emp.employment_type] ?? D.inkMuted48, fontWeight: 600, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: D.inkMuted48, borderColor: D.hairline }}>
                        {emp.join_date ? new Date(emp.join_date).toLocaleDateString("id-ID") : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
