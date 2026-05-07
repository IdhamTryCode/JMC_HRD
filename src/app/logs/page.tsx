"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Alert, Chip,
  Checkbox, ListItemText,
  OutlinedInput, MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import AppShell from "@/components/AppShell";

const ALL_MODULES = ["auth", "users", "employees", "attendance", "transport", "logs"];

type LogRow = {
  id: number;
  action: string;
  module: string;
  description: string | null;
  ip_address: string | null;
  created_at: string;
  username: string | null;
};

export default function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // multiselect filters
  const [usernames, setUsernames] = useState<string[]>([]);
  const [usernameInput, setUsernameInput] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);

  // available usernames from API for autocomplete
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/logs/users")
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => setAvailableUsers(d.data ?? []))
      .catch(() => null);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(usernames.length > 0 && { usernames: usernames.join(",") }),
        ...(modules.length > 0 && { modules: modules.join(",") }),
        ...(dateFrom && { dateFrom: dateFrom.format("YYYY-MM-DD") }),
        ...(dateTo && { dateTo: dateTo.format("YYYY-MM-DD") }),
      });
      const res = await fetch(`/api/logs?${params}`);
      if (!res.ok) throw new Error("Gagal memuat log");
      const data = await res.json();
      setRows(data.data);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, usernames, modules, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns: GridColDef[] = [
    {
      field: "created_at", headerName: "Tgl", width: 110,
      renderCell: ({ value }) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      field: "jam", headerName: "Jam", width: 100,
      sortable: false,
      renderCell: ({ row }) => dayjs(row.created_at).format("HH:mm:ss"),
    },
    {
      field: "username", headerName: "Username", width: 140,
      renderCell: ({ value }) => value ?? <Typography variant="body2" color="text.disabled">sistem</Typography>,
    },
    {
      field: "description", headerName: "Deskripsi", flex: 1, minWidth: 220,
      renderCell: ({ value }) => value ?? "—",
    },
    {
      field: "module", headerName: "Modul", width: 130,
      renderCell: ({ value }) => <Chip label={value} size="small" variant="outlined" />,
    },
  ];

  return (
    <AppShell>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Log Aktivitas
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
            {/* Username multiselect autocomplete */}
            <Autocomplete
              multiple
              options={availableUsers}
              value={usernames}
              inputValue={usernameInput}
              onInputChange={(_, v) => setUsernameInput(v)}
              onChange={(_, v) => { setUsernames(v); setPage(0); }}
              size="small"
              sx={{ minWidth: 220 }}
              renderInput={(params) => <TextField {...params} label="Username" size="small" />}
              renderTags={(val, getProps) =>
                val.map((opt, i) => <Chip label={opt} size="small" {...getProps({ index: i })} />)
              }
            />

            {/* Modul multiselect */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Modul</InputLabel>
              <Select
                multiple
                value={modules}
                onChange={(e) => {
                  setModules(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value);
                  setPage(0);
                }}
                input={<OutlinedInput label="Modul" />}
                renderValue={(sel) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {sel.map((v) => <Chip key={v} label={v} size="small" />)}
                  </Box>
                )}
              >
                {ALL_MODULES.map((m) => (
                  <MenuItem key={m} value={m}>
                    <Checkbox checked={modules.includes(m)} size="small" />
                    <ListItemText primary={m} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Dari"
              value={dateFrom}
              onChange={(v) => { setDateFrom(v); setPage(0); }}
              slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
            />
            <DatePicker
              label="Sampai"
              value={dateTo}
              onChange={(v) => { setDateTo(v); setPage(0); }}
              slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
            />
          </Box>
        </LocalizationProvider>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={total}
            loading={loading}
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            density="compact"
            getRowId={(r) => r.id}
          />
        </Box>
      </Box>
    </AppShell>
  );
}
