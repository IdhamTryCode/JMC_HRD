"use client";

import { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, Box, Chip,
  Skeleton, Alert,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

type Stats = {
  employees: { total: number; active: number };
  attendance: { total: number; hadir: number; cuti: number; izin: number; pendingVerif: number; terlambat: number };
  transport: { totalComputed: number; totalAmount: number; eligibleCount: number };
  dailyTrend: { date: string; count: number }[];
  empTypeBreakdown: { type: string; count: number }[];
  period: { year: number; month: number };
};

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h4" fontWeight={700} color={color ?? "text.primary"}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary">{sub}</Typography>
            )}
          </Box>
          <Box sx={{ color: color ?? "text.secondary", opacity: 0.7 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.ok ? r.json() : Promise.reject("Gagal"))
      .then(setStats)
      .catch(() => setError("Gagal memuat statistik"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rounded" height={110} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error || !stats) {
    return <Alert severity="error">{error || "Data tidak tersedia"}</Alert>;
  }

  const periodLabel = new Date(stats.period.year, stats.period.month - 1)
    .toLocaleString("id-ID", { month: "long", year: "numeric" });

  const formatRp = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Periode: {periodLabel}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Total Pegawai"
            value={stats.employees.total}
            sub={`${stats.employees.active} aktif`}
            icon={<PeopleIcon sx={{ fontSize: 36 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Hadir Bulan Ini"
            value={stats.attendance.hadir}
            sub={`dari ${stats.attendance.total} entri`}
            icon={<CheckCircleIcon sx={{ fontSize: 36 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Menunggu Verifikasi"
            value={stats.attendance.pendingVerif}
            sub="presensi pending"
            icon={<WarningAmberIcon sx={{ fontSize: 36 }} />}
            color={stats.attendance.pendingVerif > 0 ? "warning.main" : "text.secondary"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Terlambat"
            value={stats.attendance.terlambat}
            sub="pegawai terlambat bulan ini"
            icon={<AccessTimeIcon sx={{ fontSize: 36 }} />}
            color={stats.attendance.terlambat > 0 ? "error.main" : "text.secondary"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Tunjangan Transport"
            value={formatRp(stats.transport.totalAmount)}
            sub={`${stats.transport.eligibleCount} pegawai eligible`}
            icon={<DirectionsCarIcon sx={{ fontSize: 36 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Komposisi Pegawai</Typography>
              <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {stats.empTypeBreakdown.map((item) => (
                  <Chip
                    key={item.type}
                    label={`${item.type}: ${item.count}`}
                    size="small"
                    color={item.type === "tetap" ? "primary" : item.type === "kontrak" ? "secondary" : "default"}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {stats.dailyTrend.length > 0 && (
        <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Tren Kehadiran (30 Hari Terakhir)
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 80, overflowX: "auto" }}>
              {stats.dailyTrend.map((d) => {
                const max = Math.max(...stats.dailyTrend.map((x) => x.count), 1);
                const pct = (d.count / max) * 100;
                return (
                  <Box key={d.date} sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 20 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: `${pct}%`,
                        minHeight: 4,
                        bgcolor: "primary.main",
                        borderRadius: 0.5,
                        opacity: 0.8,
                      }}
                      title={`${d.date}: ${d.count}`}
                    />
                    <Typography variant="caption" sx={{ fontSize: 8, color: "text.disabled", mt: 0.3 }}>
                      {d.date.slice(8)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
