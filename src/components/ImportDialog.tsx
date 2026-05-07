"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Alert, Grid, MenuItem, Select, FormControl,
  InputLabel, Typography, Box, LinearProgress, Chip,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

type ImportStatus = {
  id: number;
  status: "queued" | "processing" | "done" | "failed";
  total_rows: number | null;
  success_rows: number | null;
  failed_rows: number | null;
  error_log: unknown;
  finished_at: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const now = new Date();

export default function ImportDialog({ open, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling(importId: number) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/attendances/import/${importId}`);
        if (!res.ok) return;
        const data: ImportStatus = await res.json();
        setImportStatus(data);
        if (data.status === "done" || data.status === "failed") {
          stopPolling();
          if (data.status === "done") onSuccess();
        }
      } catch {
        // silently retry
      }
    }, 3000);
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  function handleClose() {
    if (uploading) return;
    stopPolling();
    setFile(null);
    setError("");
    setImportStatus(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError("");
    setImportStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("periodYear", String(periodYear));
      formData.append("periodMonth", String(periodMonth));

      const res = await fetch("/api/attendances/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Gagal mengupload");

      setImportStatus({ id: data.id, status: "queued", total_rows: null, success_rows: null, failed_rows: null, error_log: null, finished_at: null });
      startPolling(data.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  }

  function StatusChip({ status }: { status: ImportStatus["status"] }) {
    const icons: Record<ImportStatus["status"], React.ReactElement> = {
      queued: <HourglassEmptyIcon fontSize="small" />,
      processing: <HourglassEmptyIcon fontSize="small" />,
      done: <CheckCircleIcon fontSize="small" />,
      failed: <ErrorIcon fontSize="small" />,
    };
    const colors: Record<ImportStatus["status"], "default" | "warning" | "success" | "error"> = {
      queued: "default",
      processing: "warning",
      done: "success",
      failed: "error",
    };
    const labels: Record<ImportStatus["status"], string> = {
      queued: "Antrian",
      processing: "Memproses…",
      done: "Selesai",
      failed: "Gagal",
    };
    return <Chip icon={icons[status]} label={labels[status]} color={colors[status]} size="small" />;
  }

  const isPolling = importStatus && (importStatus.status === "queued" || importStatus.status === "processing");

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Import Presensi dari Excel</DialogTitle>
        <DialogContent>
          {(uploading || isPolling) && <LinearProgress sx={{ mb: 2 }} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {importStatus && (
            <Alert
              severity={importStatus.status === "done" ? "success" : importStatus.status === "failed" ? "error" : "info"}
              sx={{ mb: 2 }}
              icon={false}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <StatusChip status={importStatus.status} />
                {isPolling && (
                  <Typography variant="caption" color="text.secondary">
                    Mengecek status setiap 3 detik…
                  </Typography>
                )}
              </Box>
              {importStatus.total_rows != null && (
                <Typography variant="body2">
                  Total: {importStatus.total_rows} baris
                  {importStatus.success_rows != null && ` · Berhasil: ${importStatus.success_rows}`}
                  {importStatus.failed_rows != null && importStatus.failed_rows > 0 && ` · Gagal: ${importStatus.failed_rows}`}
                </Typography>
              )}
            </Alert>
          )}

          {!importStatus && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tahun</InputLabel>
                  <Select value={periodYear} label="Tahun" onChange={(e) => setPeriodYear(Number(e.target.value))}>
                    {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Bulan</InputLabel>
                  <Select value={periodMonth} label="Bulan" onChange={(e) => setPeriodMonth(Number(e.target.value))}>
                    {months.map((m) => (
                      <MenuItem key={m} value={m}>
                        {new Date(2024, m - 1).toLocaleString("id-ID", { month: "long" })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: "2px dashed",
                    borderColor: file ? "primary.main" : "divider",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                    cursor: "pointer",
                    bgcolor: file ? "primary.50" : "background.paper",
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    accept=".xlsx"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <UploadFileIcon sx={{ fontSize: 40, color: file ? "primary.main" : "text.secondary" }} />
                  <Typography variant="body2" color={file ? "primary.main" : "text.secondary"} mt={1}>
                    {file ? file.name : "Klik atau drop file .xlsx di sini"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Kolom: NIP, Tanggal, Jam Masuk, Jam Keluar, Status, Keterangan
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>
            {importStatus?.status === "done" || importStatus?.status === "failed" ? "Tutup" : "Batal"}
          </Button>
          {!importStatus && (
            <Button type="submit" variant="contained" disabled={!file || uploading}>
              {uploading ? "Mengunggah…" : "Upload & Proses"}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
