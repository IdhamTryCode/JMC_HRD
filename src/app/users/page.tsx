"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AppShell from "@/components/AppShell";
import { useConfirm } from "@/components/ConfirmDialog";

type UserRow = {
  id: number;
  username: string;
  email: string | null;
  role: string;
  is_active: boolean;
  employee_name: string | null;
  created_at: string;
};

type EmployeeOption = {
  id: number;
  full_name: string;
  nip: string;
  email: string | null;
  phone: string | null;
};

const ROLES = ["superadmin", "manager_hrd", "admin_hrd"];

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myRole, setMyRole] = useState<string>("");
  const { confirm, dialog: confirmDialog } = useConfirm();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setMyRole(d.role))
      .catch(() => null);
  }, []);

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formRole, setFormRole] = useState("admin_hrd");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  // autosuggest employee
  const [empOptions, setEmpOptions] = useState<EmployeeOption[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeOption | null>(null);
  const [empLoading, setEmpLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setRows(data.data);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (!dialogOpen || editUser) return;
    if (empSearch.length < 2) { setEmpOptions([]); return; }
    setEmpLoading(true);
    fetch(`/api/employees/without-account?search=${encodeURIComponent(empSearch)}`)
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => setEmpOptions(d.data ?? []))
      .catch(() => setEmpOptions([]))
      .finally(() => setEmpLoading(false));
  }, [empSearch, dialogOpen, editUser]);

  function openCreate() {
    setEditUser(null);
    setFormUsername("");
    setFormRole("admin_hrd");
    setFormEmail("");
    setFormPhone("");
    setFormError("");
    setUsernameError("");
    setSelectedEmp(null);
    setEmpSearch("");
    setDialogOpen(true);
  }

  function openEdit(row: UserRow) {
    setEditUser(row);
    setFormUsername(row.username);
    setFormRole(row.role);
    setFormEmail(row.email ?? "");
    setFormError("");
    setUsernameError("");
    setDialogOpen(true);
  }

  function validateUsername(val: string) {
    if (val.length < 6) return "Minimal 6 karakter";
    if (!/^[a-z0-9]+$/.test(val)) return "Hanya huruf kecil dan angka, tanpa spasi";
    return "";
  }

  async function handleSubmit() {
    const err = validateUsername(formUsername);
    if (err) { setUsernameError(err); return; }
    if (!editUser && !selectedEmp) {
      setFormError("Nama Pengguna wajib dipilih dari daftar pegawai");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      if (editUser) {
        const res = await fetch(`/api/users/${editUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: formUsername, role: formRole }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal update");
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formUsername,
            role: formRole,
            employeeId: selectedEmp!.id,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal membuat user");
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleActive(row: UserRow) {
    const action = row.is_active ? "Nonaktifkan" : "Aktifkan";
    const ok = await confirm({
      title: `${action} pengguna`,
      message: `${action} user "${row.username}"?`,
      confirmLabel: action,
      danger: row.is_active,
    });
    if (!ok) return;
    const res = await fetch(`/api/users/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.is_active }),
    });
    if (res.ok) fetchUsers();
  }

  async function handleDelete(row: UserRow) {
    const ok = await confirm({
      title: "Hapus pengguna",
      message: `Hapus user "${row.username}"? Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/users/${row.id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
  }

  const columns: GridColDef[] = [
    { field: "username", headerName: "Username", flex: 1, minWidth: 120 },
    { field: "employee_name", headerName: "Nama Pegawai", flex: 1.5, minWidth: 150,
      renderCell: ({ value }) => value ?? <Typography color="text.disabled" variant="body2">—</Typography> },
    { field: "role", headerName: "Role", width: 140,
      renderCell: ({ value }) => (
        <Chip
          label={String(value).replace(/_/g, " ")}
          size="small"
          color={value === "superadmin" ? "error" : value === "manager_hrd" ? "warning" : "default"}
        />
      ),
    },
    { field: "email", headerName: "Email", flex: 1.5, minWidth: 160,
      renderCell: ({ value }) => value ?? <Typography color="text.disabled" variant="body2">—</Typography> },
    { field: "is_active", headerName: "Status", width: 100,
      renderCell: ({ value }) => (
        <Chip label={value ? "Aktif" : "Nonaktif"} size="small" color={value ? "success" : "default"} />
      ),
    },
    ...(myRole === "superadmin" ? [{
      field: "actions",
      type: "actions" as const,
      width: 130,
      getActions: ({ row }: { row: UserRow }) => [
        <GridActionsCellItem key="edit" icon={<Tooltip title="Edit"><EditIcon /></Tooltip>} label="Edit" onClick={() => openEdit(row)} />,
        <GridActionsCellItem
          key="toggle"
          icon={<Tooltip title={row.is_active ? "Nonaktifkan" : "Aktifkan"}>{row.is_active ? <CancelIcon color="warning" /> : <CheckCircleIcon color="success" />}</Tooltip>}
          label={row.is_active ? "Nonaktifkan" : "Aktifkan"}
          onClick={() => handleToggleActive(row)}
        />,
        <GridActionsCellItem key="delete" icon={<Tooltip title="Hapus"><DeleteIcon color="error" /></Tooltip>} label="Hapus" onClick={() => handleDelete(row)} />,
      ],
    }] : []),
  ];

  return (
    <AppShell>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Manajemen Pengguna</Typography>
        {myRole === "superadmin" && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Tambah User
          </Button>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        {myRole === "superadmin" && (
          <>
            <TextField
              size="small"
              placeholder="Cari username / nama…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={statusFilter}
              onChange={(_, v) => { setStatusFilter(v ?? ""); setPage(0); }}
            >
              <ToggleButton value="">Semua</ToggleButton>
              <ToggleButton value="active">Aktif</ToggleButton>
              <ToggleButton value="inactive">Nonaktif</ToggleButton>
            </ToggleButtonGroup>
          </>
        )}
      </Box>

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
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          density="compact"
        />
      </Box>
      </Box>

      {/* Dialog tambah/edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editUser ? "Edit User" : "Tambah User"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Username"
            value={formUsername}
            onChange={(e) => { const v = e.target.value.toLowerCase(); setFormUsername(v); setUsernameError(validateUsername(v)); }}
            error={!!usernameError}
            helperText={usernameError}
            required
            inputProps={{ maxLength: 50 }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={formRole} label="Role" onChange={(e) => setFormRole(e.target.value)}>
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r.replace(/_/g, " ")}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {!editUser && (
            <Autocomplete
              options={empOptions}
              loading={empLoading}
              value={selectedEmp}
              onChange={(_, val) => {
                setSelectedEmp(val);
                if (val?.email) setFormEmail(val.email);
                if (val?.phone) setFormPhone(val.phone);
              }}
              onInputChange={(_, val) => setEmpSearch(val)}
              getOptionLabel={(o) => `${o.full_name} (${o.nip})`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterOptions={(x) => x}
              noOptionsText={empSearch.length < 2 ? "Ketik min 2 karakter" : "Pegawai tidak ditemukan"}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nama Pengguna"
                  required
                  helperText="Ketik minimal 2 karakter, lalu pilih dari daftar pegawai"
                  size="small"
                />
              )}
            />
          )}
          <TextField
            label="Email"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            disabled={!editUser && !!selectedEmp}
            helperText={
              !editUser && selectedEmp
                ? "Otomatis dari data pegawai"
                : !editUser
                ? "Password awal akan dikirim ke email ini"
                : undefined
            }
          />
          {!editUser && (
            <TextField
              label="No. Seluler"
              value={formPhone}
              disabled={!!selectedEmp}
              helperText={selectedEmp ? "Otomatis dari data pegawai" : undefined}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+62..."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={formLoading}>
            {formLoading ? <CircularProgress size={18} /> : editUser ? "Simpan" : "Buat User"}
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </AppShell>
  );
}
