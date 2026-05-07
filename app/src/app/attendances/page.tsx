"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Chip, Typography, Alert, TextField,
  MenuItem, Select, FormControl, InputLabel, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid,
  Tooltip, Tab, Tabs,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AppShell from "@/components/AppShell";
import ImportDialog from "@/components/ImportDialog";

// Default N-1 bulan sesuai spec
const now = new Date();
const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const DEFAULT_YEAR = prevMonth.getFullYear();
const DEFAULT_MONTH = prevMonth.getMonth() + 1;

type RekapRow = {
  employee_id: number;
  nip: string;
  full_name: string;
  position_name: string;
  department_name: string;
  total_hari: number;
  hadir: number;
  status_terpenuhi: boolean;
  cuti: number;
  cuti_quota: number;
  izin: number;
  izin_quota: number;
  unpaid_leave: number;
  unpaid_quota: number;
};

type AttRow = {
  id: number;
  employee_id: number;
  nip: string;
  full_name: string;
  position_name: string;
  date: string;
  check_in_office_id: string | null;
  kehadiran: string;
  duration_hours: number;
  status: string;
  late_minutes: number;
  verifikasi: string;
  verifikator: string | null;
  keterangan: string | null;
  source: string;
};

const KEHADIRAN_COLOR: Record<string, "default" | "success" | "warning" | "error"> = {
  hadir: "success",
  cuti: "warning",
  izin: "default",
  unpaid_leave: "error",
};

const VERIF_COLOR: Record<string, "default" | "success" | "warning" | "error"> = {
  pending: "warning",
  disetujui: "success",
  ditolak: "error",
};

const OFFICE_LABEL: Record<string, string> = {
  gedung_utama: "Gedung Utama",
  gedung_a: "Gedung A",
  gedung_b: "Gedung B",
};

export default function AttendancesPage() {
  const [tab, setTab] = useState(0);
  const [periodYear, setPeriodYear] = useState(DEFAULT_YEAR);
  const [periodMonth, setPeriodMonth] = useState(DEFAULT_MONTH);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Rekap state
  const [rekapRows, setRekapRows] = useState<RekapRow[]>([]);
  const [rekapTotal, setRekapTotal] = useState(0);

  // Detail state
  const [attRows, setAttRows] = useState<AttRow[]>([]);
  const [attTotal, setAttTotal] = useState(0);
  const [kehadiranFilter, setKehadiranFilter] = useState("");

  const fetchRekap = useCallback(async () => {
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
      const res = await fetch(`/api/attendances/rekap?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data rekap");
      const data = await res.json();
      setRekapRows(data.data);
      setRekapTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, periodYear, periodMonth]);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        periodYear: String(periodYear),
        periodMonth: String(periodMonth),
        ...(search && { search }),
        ...(kehadiranFilter && { kehadiran: kehadiranFilter }),
      });
      const res = await fetch(`/api/attendances?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setAttRows(data.data);
      setAttTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, periodYear, periodMonth, kehadiranFilter]);

  useEffect(() => {
    setPage(0);
  }, [tab]);

  useEffect(() => {
    if (tab === 0) fetchRekap();
    else fetchDetail();
  }, [tab, fetchRekap, fetchDetail]);

  async function handleDelete(id: number) {
    if (!confirm("Hapus data presensi ini?")) return;
    await fetch(`/api/attendances/${id}`, { method: "DELETE" });
    fetchDetail();
  }

  async function handleVerify(id: number, verifikasi: "disetujui" | "ditolak") {
    await fetch(`/api/attendances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verifikasi }),
    });
    fetchDetail();
  }

  const rekapColumns: GridColDef[] = [
    {
      field: "_no", headerName: "No", width: 55, sortable: false,
      renderCell: ({ api, row }) => {
        const idx = api.getAllRowIds().indexOf(row.employee_id);
        return page * pageSize + idx + 1;
      },
    },
    { field: "full_name", headerName: "Nama", flex: 1.5, minWidth: 140 },
    { field: "position_name", headerName: "Jabatan", flex: 1, minWidth: 110 },
    { field: "hadir", headerName: "Hadir", width: 70, align: "center", headerAlign: "center",
      renderCell: ({ value }) => Number(value).toFixed(1),
    },
    {
      field: "status_terpenuhi", headerName: "Status Hadir", width: 130, align: "center", headerAlign: "center",
      renderCell: ({ value }) => (
        <Chip label={value ? "Terpenuhi" : "Tidak terpenuhi"} size="small" color={value ? "success" : "error"} />
      ),
    },
    { field: "cuti", headerName: "Cuti", width: 55, align: "center", headerAlign: "center",
      renderCell: ({ value }) => Number(value).toFixed(1),
    },
    { field: "cuti_quota", headerName: "Kuota Cuti", width: 90, align: "center", headerAlign: "center",
      renderCell: ({ value }) => Number(value).toFixed(1),
    },
    { field: "izin", headerName: "Izin", width: 55, align: "center", headerAlign: "center",
      renderCell: ({ value }) => Number(value).toFixed(1),
    },
    { field: "izin_quota", headerName: "Kuota Izin", width: 90, align: "center", headerAlign: "center",
      renderCell: ({ value }) => Number(value).toFixed(1),
    },
    { field: "unpaid_leave", headerName: "Unpaid Leave", width: 100, align: "center", headerAlign: "center",
      renderCell: ({ value }) => Number(value).toFixed(1),
    },
    { field: "unpaid_quota", headerName: "Kuota Unpaid", width: 100, align: "center", headerAlign: "center",
      renderCell: ({ value }) => Number(value).toFixed(1),
    },
    {
      field: "actions", type: "actions", width: 70,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="view"
          icon={<Tooltip title="Lihat Detail"><VisibilityIcon fontSize="small" /></Tooltip>}
          label="Detail"
          onClick={() => {
            setTab(1);
            setSearch(row.full_name);
          }}
        />,
      ],
    },
  ];

  const detailColumns: GridColDef[] = [
    { field: "date", headerName: "Tanggal", width: 100 },
    { field: "full_name", headerName: "Nama", flex: 1.2, minWidth: 130 },
    { field: "position_name", headerName: "Jabatan", flex: 1, minWidth: 100 },
    {
      field: "check_in_office_id", headerName: "Lokasi Checkin", width: 130,
      renderCell: ({ value }) => OFFICE_LABEL[value] ?? value ?? "—",
    },
    {
      field: "kehadiran", headerName: "Kehadiran", width: 100,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={KEHADIRAN_COLOR[value] ?? "default"} />
      ),
    },
    { field: "duration_hours", headerName: "Durasi", width: 80,
      renderCell: ({ value }) => `${Number(value).toFixed(1)} j` },
    {
      field: "status", headerName: "Status", width: 130,
      renderCell: ({ value }) => (
        <Chip label={value === "terpenuhi" ? "Terpenuhi" : "Tidak terpenuhi"} size="small" color={value === "terpenuhi" ? "success" : "error"} />
      ),
    },
    {
      field: "verifikasi", headerName: "Verifikasi", width: 100,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={VERIF_COLOR[value] ?? "default"} />
      ),
    },
    { field: "verifikator", headerName: "Verifikator", width: 100,
      renderCell: ({ value }) => value ?? "—" },
    { field: "keterangan", headerName: "Keterangan", flex: 1, minWidth: 100,
      renderCell: ({ value }) => value ?? "—" },
    {
      field: "actions", type: "actions", width: 110,
      getActions: ({ row }) => [
        row.verifikasi === "pending"
          ? <GridActionsCellItem key="approve" icon={<Tooltip title="Setujui"><Chip label="✓" size="small" color="success" /></Tooltip>} label="Setujui" onClick={() => handleVerify(row.id, "disetujui")} />
          : <GridActionsCellItem key="noop" icon={<span />} label="" />,
        <GridActionsCellItem key="del" icon={<Tooltip title="Hapus"><DeleteIcon color="error" fontSize="small" /></Tooltip>} label="Hapus" onClick={() => handleDelete(row.id)} />,
      ],
    },
  ];

  const years = Array.from({ length: 5 }, (_, i) => DEFAULT_YEAR - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <AppShell>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Presensi</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={() => {
              const params = new URLSearchParams({
                periodYear: String(periodYear),
                periodMonth: String(periodMonth),
                ...(search && { search }),
              });
              window.open(`/api/attendances/export?${params}`, "_blank");
            }}
          >
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} href="/api/attendances/template" download="template-presensi.xlsx">
            Download Template
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setImportOpen(true)}>
            Import Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Tambah Manual
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
        {tab === 1 && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={kehadiranFilter} label="Status" onChange={(e) => { setKehadiranFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="hadir">Hadir</MenuItem>
              <MenuItem value="cuti">Cuti</MenuItem>
              <MenuItem value="izin">Izin</MenuItem>
              <MenuItem value="unpaid_leave">Unpaid Leave</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Rekap per Pegawai" />
        <Tab label="Detail Presensi" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {tab === 0 && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataGrid
            rows={rekapRows} columns={rekapColumns} rowCount={rekapTotal} loading={loading}
            getRowId={(r) => r.employee_id}
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            density="compact"
          />
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataGrid
            rows={attRows} columns={detailColumns} rowCount={attTotal} loading={loading}
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            density="compact"
          />
        </Box>
      )}

      </Box>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onSuccess={() => { fetchRekap(); fetchDetail(); }} />
      <AddAttendanceDialog open={addOpen} onClose={() => setAddOpen(false)} onSuccess={() => { fetchRekap(); fetchDetail(); }} />
    </AppShell>
  );
}

function AddAttendanceDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    employeeId: "",
    date: "",
    checkInAt: "",
    checkOutAt: "",
    kehadiran: "hadir",
    keterangan: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const dateStr = form.date;
      const checkInAt = form.checkInAt ? `${dateStr}T${form.checkInAt}:00+07:00` : null;
      const checkOutAt = form.checkOutAt ? `${dateStr}T${form.checkOutAt}:00+07:00` : null;

      let durationHours = 0;
      let lateMinutes = 0;
      let isHalfday = false;

      if (form.checkInAt && form.checkOutAt) {
        const [inH, inM] = form.checkInAt.split(":").map(Number);
        const [outH, outM] = form.checkOutAt.split(":").map(Number);
        durationHours = Math.max(0, (outH * 60 + outM - inH * 60 - inM) / 60);

        // Jam masuk standar 08:00
        const stdH = 8, stdM = 0;
        lateMinutes = Math.max(0, inH * 60 + inM - (stdH * 60 + stdM));
        // >15 menit terlambat = halfday jika durasi < 8 jam
        if (lateMinutes > 15 && durationHours < 8) {
          isHalfday = true;
        }
      }

      const res = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: Number(form.employeeId),
          date: form.date,
          checkInAt,
          checkOutAt,
          kehadiran: form.kehadiran,
          durationHours,
          lateMinutes,
          isHalfday,
          keterangan: form.keterangan || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal menyimpan");
      }
      onSuccess();
      onClose();
      setForm({ employeeId: "", date: "", checkInAt: "", checkOutAt: "", kehadiran: "hadir", keterangan: "" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Tambah Presensi Manual</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField label="Employee ID" value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} required fullWidth size="small" type="number" helperText="Masukkan ID pegawai" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Tanggal" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Jam Masuk" type="time" value={form.checkInAt} onChange={(e) => setForm((f) => ({ ...f, checkInAt: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Jam Keluar" type="time" value={form.checkOutAt} onChange={(e) => setForm((f) => ({ ...f, checkOutAt: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status Kehadiran</InputLabel>
                <Select value={form.kehadiran} label="Status Kehadiran" onChange={(e) => setForm((f) => ({ ...f, kehadiran: e.target.value }))}>
                  <MenuItem value="hadir">Hadir</MenuItem>
                  <MenuItem value="cuti">Cuti</MenuItem>
                  <MenuItem value="izin">Izin</MenuItem>
                  <MenuItem value="unpaid_leave">Unpaid Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Keterangan" value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} fullWidth size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Batal</Button>
          <Button type="submit" variant="contained" disabled={loading}>{loading ? "Menyimpan…" : "Simpan"}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
