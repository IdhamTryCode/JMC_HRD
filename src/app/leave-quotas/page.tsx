"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Chip, Typography, Alert, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid,
  Tooltip, CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import AppShell from "@/components/AppShell";

type QuotaRow = {
  id: number;
  employee_id: number;
  nip: string;
  full_name: string;
  position_name: string;
  department_name: string;
  year: number;
  cuti_quota: number;
  izin_quota: number;
  unpaid_leave_quota: number;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);

export default function LeaveQuotasPage() {
  const [rows, setRows] = useState<QuotaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<QuotaRow | null>(null);
  const [formCuti, setFormCuti] = useState("12");
  const [formIzin, setFormIzin] = useState("12");
  const [formUnpaid, setFormUnpaid] = useState("3");
  const [formYear, setFormYear] = useState(CURRENT_YEAR);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchQuotas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        year: String(year),
        ...(search && { search }),
      });
      const res = await fetch(`/api/leave-quotas?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setRows(data.data);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, year]);

  useEffect(() => { fetchQuotas(); }, [fetchQuotas]);

  function openEdit(row: QuotaRow) {
    setEditRow(row);
    setFormCuti(String(row.cuti_quota));
    setFormIzin(String(row.izin_quota));
    setFormUnpaid(String(row.unpaid_leave_quota));
    setFormYear(row.year);
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/leave-quotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: editRow.employee_id,
          year: formYear,
          cutiQuota: Number(formCuti),
          izinQuota: Number(formIzin),
          unpaidLeaveQuota: Number(formUnpaid),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      setDialogOpen(false);
      fetchQuotas();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setFormLoading(false);
    }
  }

  const columns: GridColDef[] = [
    {
      field: "_no", headerName: "No", width: 55, sortable: false,
      renderCell: ({ api, row }) => {
        const idx = api.getAllRowIds().indexOf(row.id);
        return page * pageSize + idx + 1;
      },
    },
    { field: "nip", headerName: "NIP", width: 110 },
    { field: "full_name", headerName: "Nama", flex: 1.5, minWidth: 140 },
    { field: "position_name", headerName: "Jabatan", flex: 1, minWidth: 110 },
    { field: "department_name", headerName: "Departemen", flex: 1, minWidth: 110 },
    {
      field: "cuti_quota", headerName: "Kuota Cuti", width: 105, align: "center", headerAlign: "center",
      renderCell: ({ value }) => <Chip label={`${value} hari`} size="small" color="primary" />,
    },
    {
      field: "izin_quota", headerName: "Kuota Izin", width: 105, align: "center", headerAlign: "center",
      renderCell: ({ value }) => <Chip label={`${value} hari`} size="small" />,
    },
    {
      field: "unpaid_leave_quota", headerName: "Kuota Unpaid", width: 115, align: "center", headerAlign: "center",
      renderCell: ({ value }) => <Chip label={`${value} hari`} size="small" color="warning" />,
    },
    {
      field: "actions", type: "actions", width: 70,
      getActions: ({ row }) => [
        <GridActionsCellItem key="edit" icon={<Tooltip title="Edit Kuota"><EditIcon /></Tooltip>} label="Edit" onClick={() => openEdit(row)} />,
      ],
    },
  ];

  return (
    <AppShell>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>Kuota Cuti &amp; Izin</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            size="small" placeholder="Cari nama / NIP…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 220 }}
          />
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Tahun</InputLabel>
            <Select value={year} label="Tahun" onChange={(e) => { setYear(Number(e.target.value)); setPage(0); }}>
              {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Edit Kuota — {editRow?.full_name}</DialogTitle>
          <DialogContent sx={{ pt: "16px !important" }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tahun</InputLabel>
                  <Select value={formYear} label="Tahun" onChange={(e) => setFormYear(Number(e.target.value))}>
                    {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <TextField label="Kuota Cuti" type="number" fullWidth size="small"
                  value={formCuti} onChange={(e) => setFormCuti(e.target.value)}
                  inputProps={{ min: 0, max: 30 }} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Kuota Izin" type="number" fullWidth size="small"
                  value={formIzin} onChange={(e) => setFormIzin(e.target.value)}
                  inputProps={{ min: 0, max: 30 }} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Unpaid" type="number" fullWidth size="small"
                  value={formUnpaid} onChange={(e) => setFormUnpaid(e.target.value)}
                  inputProps={{ min: 0, max: 30 }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" variant="contained" disabled={formLoading}>
              {formLoading ? <CircularProgress size={18} /> : "Simpan"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </AppShell>
  );
}
