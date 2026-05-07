"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Chip, Typography, Alert, TextField,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import CalculateIcon from "@mui/icons-material/Calculate";
import SettingsIcon from "@mui/icons-material/Settings";
import AppShell from "@/components/AppShell";

type AllowanceRow = {
  id: number;
  employee_id: number;
  nip: string;
  full_name: string;
  position_name: string;
  department_name: string;
  period_year: number;
  period_month: number;
  distance_km_raw: number;
  distance_km_used: number;
  working_days: number;
  base_fare: number;
  amount: number;
  eligible: boolean;
  reason: string | null;
};

const now = new Date();

export default function TransportAllowancesPage() {
  const [rows, setRows] = useState<AllowanceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [computeOpen, setComputeOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        periodYear: String(periodYear),
        periodMonth: String(periodMonth),
        ...(search && { search }),
      });
      const res = await fetch(`/api/transport-allowances?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setRows(data.data);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, periodYear, periodMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatRp = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const columns: GridColDef[] = [
    { field: "nip", headerName: "NIP", width: 110 },
    { field: "full_name", headerName: "Nama", flex: 1.2, minWidth: 130 },
    { field: "department_name", headerName: "Departemen", flex: 1, minWidth: 110 },
    { field: "distance_km_raw", headerName: "Jarak (km)", width: 100,
      renderCell: ({ value }) => `${Number(value).toFixed(1)} km` },
    { field: "working_days", headerName: "Hari Masuk", width: 100 },
    { field: "base_fare", headerName: "Tarif/km", width: 110,
      renderCell: ({ value }) => formatRp(Number(value)) },
    { field: "amount", headerName: "Tunjangan", width: 130,
      renderCell: ({ value }) => <Typography fontWeight={600}>{formatRp(Number(value))}</Typography> },
    {
      field: "eligible", headerName: "Eligible", width: 90,
      renderCell: ({ value }) => (
        <Chip label={value ? "Ya" : "Tidak"} size="small" color={value ? "success" : "default"} />
      ),
    },
    { field: "reason", headerName: "Alasan", flex: 1, minWidth: 150,
      renderCell: ({ value }) => value ?? "—" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <AppShell>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Tunjangan Transport</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setSettingOpen(true)}>
            Setting Tarif
          </Button>
          <Button variant="contained" startIcon={<CalculateIcon />} onClick={() => setComputeOpen(true)}>
            Hitung Tunjangan
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small" placeholder="Cari nama / NIP…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Tahun</InputLabel>
          <Select value={periodYear} label="Tahun" onChange={(e) => { setPeriodYear(Number(e.target.value)); setPage(0); }}>
            {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>Bulan</InputLabel>
          <Select value={periodMonth} label="Bulan" onChange={(e) => { setPeriodMonth(Number(e.target.value)); setPage(0); }}>
            {months.map((m) => (
              <MenuItem key={m} value={m}>
                {new Date(2024, m - 1).toLocaleString("id-ID", { month: "long" })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataGrid
          rows={rows} columns={columns} rowCount={total} loading={loading}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          density="compact"
        />
      </Box>
      </Box>

      <ComputeDialog
        open={computeOpen}
        onClose={() => setComputeOpen(false)}
        onSuccess={fetchData}
      />
      <SettingDialog
        open={settingOpen}
        onClose={() => setSettingOpen(false)}
      />
    </AppShell>
  );
}

function ComputeDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ computed: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  async function handleCompute() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/transport-allowances/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodYear: year, periodMonth: month }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghitung");
      setResult({ computed: data.computed, skipped: data.skipped });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Hitung Tunjangan Transport</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {result && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Berhasil: {result.computed} pegawai dihitung
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Tahun</InputLabel>
              <Select value={year} label="Tahun" onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Bulan</InputLabel>
              <Select value={month} label="Bulan" onChange={(e) => setMonth(Number(e.target.value))}>
                {months.map((m) => (
                  <MenuItem key={m} value={m}>
                    {new Date(2024, m - 1).toLocaleString("id-ID", { month: "long" })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Akan menghitung untuk semua pegawai aktif yang memiliki koordinat domisili.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Tutup</Button>
        <Button variant="contained" onClick={handleCompute} disabled={loading}>
          {loading ? "Menghitung…" : "Hitung Sekarang"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SettingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [baseFare, setBaseFare] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/transport-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseFarePerKm: Number(baseFare), effectiveFrom }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      setSuccess("Tarif berhasil disimpan");
      setBaseFare("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSave}>
        <DialogTitle>Setting Tarif Transport</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Tarif per km (Rp)"
                type="number"
                value={baseFare}
                onChange={(e) => setBaseFare(e.target.value)}
                required fullWidth size="small"
                helperText="Contoh: 5000 = Rp5.000/km"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Berlaku Mulai"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required fullWidth size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Tutup</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
