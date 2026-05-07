"use client";

import { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  InputLabel,
  Typography,
  Button,
  IconButton,
  Box,
  Divider,
  Avatar,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import WilayahSelect from "./WilayahSelect";

type Education = {
  level: string;
  institution: string;
  major: string;
  yearStart: string;
  yearEnd: string;
};

type WilayahVal = {
  provinsiId: number | null;
  kabupatenId: number | null;
  kecamatanId: number | null;
  kelurahanId: number | null;
};

type WilayahLabels = {
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
};

type KabupatenOption = { id: number; name: string; provinsi: string };

export type EmployeeFormData = {
  nip: string;
  fullName: string;
  email: string;
  phone: string;
  positionId: string;
  departmentId: string;
  employmentType: string;
  gender: string;
  birthDate: string;
  birthKabupaten: KabupatenOption | null;
  maritalStatus: string;
  childrenCount: string;
  joinDate: string;
  addressDetail: string;
  latitude: string;
  longitude: string;
  wilayah: WilayahVal;
  educations: Education[];
  photoFile: File | null;
  photoPreview: string;
};

type Master = { id: number; name: string };

type Props = {
  initial?: Partial<EmployeeFormData>;
  initialWilayahLabels?: WilayahLabels;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
};

const DEFAULT_FORM: EmployeeFormData = {
  nip: "", fullName: "", email: "", phone: "",
  positionId: "", departmentId: "", employmentType: "",
  gender: "", birthDate: "", birthKabupaten: null,
  maritalStatus: "", childrenCount: "0",
  joinDate: "", addressDetail: "", latitude: "", longitude: "",
  wilayah: { provinsiId: null, kabupatenId: null, kecamatanId: null, kelurahanId: null },
  educations: [],
  photoFile: null, photoPreview: "",
};

export default function EmployeeForm({ initial, initialWilayahLabels, onSubmit, loading, submitLabel = "Simpan" }: Props) {
  const [form, setForm] = useState<EmployeeFormData>({ ...DEFAULT_FORM, ...initial });
  const [positions, setPositions] = useState<Master[]>([]);
  const [departments, setDepartments] = useState<Master[]>([]);
  const [phoneError, setPhoneError] = useState("");
  const [birthKabInput, setBirthKabInput] = useState("");
  const [birthKabOptions, setBirthKabOptions] = useState<KabupatenOption[]>([]);
  const [birthKabLoading, setBirthKabLoading] = useState(false);

  // Autosuggest tempat lahir: trigger min 2 karakter, debounce 250ms
  useEffect(() => {
    const q = birthKabInput.trim();
    if (q.length < 2) { setBirthKabOptions([]); return; }
    setBirthKabLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/wilayah?type=kabupaten&search=${encodeURIComponent(q)}`)
        .then((r) => r.ok ? r.json() : [])
        .then((d) => setBirthKabOptions(Array.isArray(d) ? d : []))
        .catch(() => setBirthKabOptions([]))
        .finally(() => setBirthKabLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [birthKabInput]);

  useEffect(() => {
    fetch("/api/master").then((r) => r.json()).then((d) => {
      setPositions(d.positions ?? []);
      setDepartments(d.departments ?? []);
    });
  }, []);

  // update saat initial berubah (mode edit)
  useEffect(() => {
    if (initial) setForm((f) => ({ ...f, ...initial }));
  }, [initial]);

  function set<K extends keyof EmployeeFormData>(key: K, val: EmployeeFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addEducation() {
    set("educations", [...form.educations, { level: "", institution: "", major: "", yearStart: "", yearEnd: "" }]);
  }

  function removeEducation(i: number) {
    set("educations", form.educations.filter((_, idx) => idx !== i));
  }

  function setEdu(i: number, key: keyof Education, val: string) {
    const next = [...form.educations];
    next[i] = { ...next[i], [key]: val };
    set("educations", next);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    set("photoFile", file);
    set("photoPreview", URL.createObjectURL(file));
  }

  function validatePhone(val: string): string {
    if (!val) return "No. HP wajib diisi";
    if (!/^\+[1-9]\d{6,19}$/.test(val)) return "Format internasional: +628xxx (contoh: +6281234567890)";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePhone(form.phone);
    if (err) { setPhoneError(err); return; }
    await onSubmit(form);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Data Dasar
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="NIP" value={form.nip} onChange={(e) => set("nip", e.target.value)} required fullWidth size="small" inputProps={{ maxLength: 20 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Nama Lengkap" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required fullWidth size="small" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required fullWidth size="small" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="No. HP" value={form.phone} required fullWidth size="small" placeholder="+628..."
            onChange={(e) => { set("phone", e.target.value); setPhoneError(validatePhone(e.target.value)); }}
            error={!!phoneError}
            helperText={phoneError || "Format internasional, contoh: +6281234567890"}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" required>
            <InputLabel>Jabatan</InputLabel>
            <Select value={form.positionId} label="Jabatan" onChange={(e) => set("positionId", e.target.value)}>
              {positions.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" required>
            <InputLabel>Departemen</InputLabel>
            <Select value={form.departmentId} label="Departemen" onChange={(e) => set("departmentId", e.target.value)}>
              {departments.map((d) => <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" required>
            <InputLabel>Jenis Karyawan</InputLabel>
            <Select value={form.employmentType} label="Jenis Karyawan" onChange={(e) => set("employmentType", e.target.value)}>
              <MenuItem value="tetap">Tetap</MenuItem>
              <MenuItem value="kontrak">Kontrak</MenuItem>
              <MenuItem value="magang">Magang</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Tanggal Bergabung" type="date" value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)} required fullWidth size="small" InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Data Pribadi
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Gender</InputLabel>
            <Select value={form.gender} label="Gender" onChange={(e) => set("gender", e.target.value)}>
              <MenuItem value="pria">Laki-laki</MenuItem>
              <MenuItem value="wanita">Perempuan</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Tanggal Lahir" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Usia"
            value={form.joinDate ? String(new Date().getFullYear() - new Date(form.joinDate).getFullYear() - (new Date() < new Date(new Date(form.joinDate).setFullYear(new Date().getFullYear())) ? 1 : 0)) + " tahun" : "—"}
            fullWidth size="small"
            disabled
            InputLabelProps={{ shrink: true }}
            helperText="Otomatis terisi dari tanggal masuk"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            value={form.birthKabupaten}
            onChange={(_, v) => set("birthKabupaten", v)}
            inputValue={birthKabInput}
            onInputChange={(_, v) => setBirthKabInput(v)}
            options={birthKabOptions}
            loading={birthKabLoading}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(x) => x}
            noOptionsText={birthKabInput.length < 2 ? "Ketik min 2 karakter" : "Tidak ditemukan"}
            renderOption={(props, o) => (
              <li {...props} key={o.id}>
                <Box>
                  <Typography variant="body2">{o.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{o.provinsi}</Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Tempat Lahir" size="small" placeholder="Ketik nama kabupaten…" />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset" size="small">
            <FormLabel component="legend" sx={{ fontSize: 13, mb: 0.5 }}>Status Kawin</FormLabel>
            <RadioGroup
              row
              value={form.maritalStatus}
              onChange={(e) => set("maritalStatus", e.target.value)}
            >
              <FormControlLabel value="kawin" control={<Radio size="small" />} label="Kawin" />
              <FormControlLabel value="tidak_kawin" control={<Radio size="small" />} label="Tidak Kawin" />
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Jumlah Anak" type="number"
            value={form.childrenCount}
            onChange={(e) => {
              // maksimal 2 digit per spec
              const v = e.target.value.replace(/\D/g, "").slice(0, 2);
              set("childrenCount", v);
            }}
            fullWidth size="small"
            inputProps={{ min: 0, max: 99, maxLength: 2 }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Alamat Domisili
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <WilayahSelect value={form.wilayah} onChange={(v) => set("wilayah", v)} initialLabels={initialWilayahLabels} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Detail Alamat" value={form.addressDetail} onChange={(e) => set("addressDetail", e.target.value)} fullWidth size="small" multiline rows={2} placeholder="Jl. Contoh No. 1, RT 01/RW 02" />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Latitude" type="number" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} fullWidth size="small" placeholder="-6.200000" inputProps={{ step: "any" }} helperText="Koordinat domisili (untuk tunjangan)" />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Longitude" type="number" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} fullWidth size="small" placeholder="106.800000" inputProps={{ step: "any" }} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>Riwayat Pendidikan</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addEducation}>Tambah</Button>
      </Box>
      {form.educations.map((edu, i) => (
        <Box key={i} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>Pendidikan {i + 1}</Typography>
            <IconButton size="small" onClick={() => removeEducation(i)}><DeleteIcon fontSize="small" /></IconButton>
          </Box>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Jenjang</InputLabel>
                <Select value={edu.level} label="Jenjang" onChange={(e) => setEdu(i, "level", e.target.value)}>
                  {["SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3"].map((l) => (
                    <MenuItem key={l} value={l}>{l}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField label="Nama Institusi" value={edu.institution} onChange={(e) => setEdu(i, "institution", e.target.value)} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Jurusan" value={edu.major} onChange={(e) => setEdu(i, "major", e.target.value)} fullWidth size="small" />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Tahun Masuk" type="number" value={edu.yearStart} onChange={(e) => setEdu(i, "yearStart", e.target.value)} fullWidth size="small" />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Tahun Lulus" type="number" value={edu.yearEnd} onChange={(e) => setEdu(i, "yearEnd", e.target.value)} fullWidth size="small" />
            </Grid>
          </Grid>
        </Box>
      ))}

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Foto</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Avatar src={form.photoPreview} sx={{ width: 80, height: 80 }} />
        <Button variant="outlined" component="label" size="small">
          Pilih Foto
          <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
        </Button>
        <Typography variant="caption" color="text.secondary">JPG/PNG/WebP, maks 2MB</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
        <Button type="submit" variant="contained" disabled={loading} size="large">
          {loading ? "Menyimpan…" : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
