"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Chip, Typography, Alert, Tooltip,
  TextField, MenuItem, Select, FormControl, InputLabel,
  ToggleButton, ToggleButtonGroup, OutlinedInput, ListItemText, Checkbox,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel, GridSortModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type EmpRow = {
  id: number;
  nip: string;
  full_name: string;
  email: string;
  employment_type: string;
  gender: string | null;
  join_date: string;
  masa_kerja_tahun: number;
  position_name: string;
  department_name: string;
  is_active: boolean;
};

type PositionOption = { id: number; name: string };

const EMP_TYPE_COLOR: Record<string, "default" | "primary" | "secondary"> = {
  tetap: "primary",
  kontrak: "secondary",
  magang: "default",
};

export default function EmployeesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<EmpRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [empTypes, setEmpTypes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState("");
  const [positionId, setPositionId] = useState("");
  const [masaKerjaOp, setMasaKerjaOp] = useState("");
  const [masaKerjaVal, setMasaKerjaVal] = useState("");
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<GridRowSelectionModel>([]);

  useEffect(() => {
    fetch("/api/positions")
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => setPositions(d.data ?? []));
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const sortBy = sortModel[0]?.field ?? "full_name";
      const sortDir = sortModel[0]?.sort ?? "asc";
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        sortBy,
        sortDir,
        ...(search && { search }),
        ...(empTypes.length > 0 && { employmentType: empTypes.join(",") }),
        ...(isActive !== "" && { isActive }),
        ...(positionId && { positionId }),
        ...(masaKerjaOp && masaKerjaVal && { masaKerjaOp, masaKerjaVal }),
      });
      const res = await fetch(`/api/employees?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setRows(data.data);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, empTypes, isActive, positionId, masaKerjaOp, masaKerjaVal, sortModel]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Hapus pegawai ${name}?`)) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    fetchEmployees();
  }

  async function handleBulkDelete() {
    if (!confirm(`Hapus ${selected.length} pegawai terpilih?`)) return;
    await Promise.all(selected.map((id) => fetch(`/api/employees/${id}`, { method: "DELETE" })));
    setSelected([]);
    fetchEmployees();
  }

  const columns: GridColDef[] = [
    {
      field: "_no", headerName: "No", width: 60, sortable: false,
      renderCell: ({ api, row }) => {
        const idx = api.getAllRowIds().indexOf(row.id);
        return page * pageSize + idx + 1;
      },
    },
    { field: "nip", headerName: "NIP", width: 120 },
    { field: "full_name", headerName: "Nama", flex: 1.5, minWidth: 150 },
    { field: "position_name", headerName: "Jabatan", flex: 1, minWidth: 120 },
    { field: "department_name", headerName: "Departemen", flex: 1, minWidth: 120 },
    {
      field: "employment_type", headerName: "Jenis", width: 100,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={EMP_TYPE_COLOR[value] ?? "default"} />
      ),
    },
    {
      field: "join_date", headerName: "Tgl Masuk", width: 110,
      renderCell: ({ value }) => value ? new Date(value).toLocaleDateString("id-ID") : "—",
    },
    { field: "masa_kerja_tahun", headerName: "Masa Kerja", width: 110,
      renderCell: ({ value }) => `${value} thn` },
    {
      field: "is_active", headerName: "Status", width: 90,
      renderCell: ({ value }) => <Chip label={value ? "Aktif" : "Nonaktif"} size="small" color={value ? "success" : "default"} />,
    },
    {
      field: "actions", type: "actions", width: 160,
      getActions: ({ row }) => [
        <GridActionsCellItem key="view" icon={<Tooltip title="Detail"><VisibilityIcon /></Tooltip>} label="Detail" onClick={() => router.push(`/employees/${row.id}`)} />,
        <GridActionsCellItem key="edit" icon={<Tooltip title="Edit"><EditIcon /></Tooltip>} label="Edit" onClick={() => router.push(`/employees/${row.id}/edit`)} />,
        <GridActionsCellItem key="pdf" icon={<Tooltip title="Download PDF"><PictureAsPdfIcon /></Tooltip>} label="PDF" onClick={() => window.open(`/api/employees/${row.id}/pdf`, "_blank")} />,
        <GridActionsCellItem key="del" icon={<Tooltip title="Hapus"><DeleteIcon color="error" /></Tooltip>} label="Hapus" onClick={() => handleDelete(row.id, row.full_name)} />,
      ],
    },
  ];

  return (
    <AppShell>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Data Pegawai</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {selected.length > 0 && (
            <Button variant="outlined" color="error" onClick={handleBulkDelete}>
              Hapus ({selected.length})
            </Button>
          )}
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => window.open("/api/employees/export", "_blank")}>
            Export Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/employees/new")}>
            Tambah Pegawai
          </Button>
        </Box>
      </Box>

      {/* Baris filter 1 */}
      <Box sx={{ display: "flex", gap: 2, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small" placeholder="Cari nama / NIP / jabatan…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Jenis Kepegawaian</InputLabel>
          <Select
            multiple
            value={empTypes}
            onChange={(e) => { setEmpTypes(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value); setPage(0); }}
            input={<OutlinedInput label="Jenis Kepegawaian" />}
            renderValue={(sel) => sel.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}
          >
            {["tetap", "kontrak", "magang"].map((t) => (
              <MenuItem key={t} value={t}>
                <Checkbox checked={empTypes.includes(t)} size="small" />
                <ListItemText primary={t.charAt(0).toUpperCase() + t.slice(1)} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Jabatan</InputLabel>
          <Select value={positionId} label="Jabatan" onChange={(e) => { setPositionId(e.target.value); setPage(0); }}>
            <MenuItem value="">Semua</MenuItem>
            {positions.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <ToggleButtonGroup size="small" exclusive value={isActive} onChange={(_, v) => { setIsActive(v ?? ""); setPage(0); }}>
          <ToggleButton value="">Semua</ToggleButton>
          <ToggleButton value="true">Aktif</ToggleButton>
          <ToggleButton value="false">Nonaktif</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Baris filter 2: masa kerja */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">Masa Kerja:</Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select value={masaKerjaOp} displayEmpty onChange={(e) => { setMasaKerjaOp(e.target.value); setPage(0); }}>
            <MenuItem value="">Semua</MenuItem>
            <MenuItem value="gte">≥ (min)</MenuItem>
            <MenuItem value="lte">≤ (maks)</MenuItem>
            <MenuItem value="eq">= (tepat)</MenuItem>
            <MenuItem value="gt">&gt; (lebih dari)</MenuItem>
            <MenuItem value="lt">&lt; (kurang dari)</MenuItem>
          </Select>
        </FormControl>
        {masaKerjaOp && (
          <TextField
            size="small" type="number" placeholder="Tahun"
            value={masaKerjaVal}
            onChange={(e) => { setMasaKerjaVal(e.target.value); setPage(0); }}
            sx={{ width: 90 }}
            inputProps={{ min: 0, max: 50 }}
          />
        )}
        {masaKerjaOp && (
          <Button size="small" variant="text" onClick={() => { setMasaKerjaOp(""); setMasaKerjaVal(""); setPage(0); }}>
            Reset
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataGrid
          rows={rows} columns={columns} rowCount={total} loading={loading}
          paginationMode="server"
          sortingMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
          onSortModelChange={(model) => { setSortModel(model); setPage(0); }}
          sortModel={sortModel}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selected}
          onRowSelectionModelChange={setSelected}
          density="compact"
        />
      </Box>
      </Box>
    </AppShell>
  );
}
