"use client";

import { useState, useEffect } from "react";
import { Autocomplete, TextField, Grid, Box, Typography } from "@mui/material";

type KecamatanOption = {
  id: number;
  name: string;
  kabupaten_id: number;
  kabupaten: string;
  provinsi_id: number;
  provinsi: string;
};

type KelurahanOption = { id: number; name: string };

type Props = {
  value: {
    provinsiId: number | null;
    kabupatenId: number | null;
    kecamatanId: number | null;
    kelurahanId: number | null;
  };
  onChange: (val: {
    provinsiId: number | null;
    kabupatenId: number | null;
    kecamatanId: number | null;
    kelurahanId: number | null;
  }) => void;
  // Untuk mode edit: preset label kecamatan/kabupaten/provinsi tanpa perlu refetch
  initialLabels?: {
    kecamatan?: string | null;
    kabupaten?: string | null;
    provinsi?: string | null;
  };
  disabled?: boolean;
};

export default function WilayahSelect({ value, onChange, initialLabels, disabled }: Props) {
  const [kecamatanInput, setKecamatanInput] = useState("");
  const [kecamatanOptions, setKecamatanOptions] = useState<KecamatanOption[]>([]);
  const [kecamatanLoading, setKecamatanLoading] = useState(false);
  const [selectedKecamatan, setSelectedKecamatan] = useState<KecamatanOption | null>(null);

  const [kelurahanList, setKelurahanList] = useState<KelurahanOption[]>([]);
  const [selectedKelurahan, setSelectedKelurahan] = useState<KelurahanOption | null>(null);

  // Saat initial value (mode edit): muat detail kecamatan + kelurahan dari id yang sudah ada
  useEffect(() => {
    if (!value.kecamatanId || selectedKecamatan?.id === value.kecamatanId) return;
    fetch(`/api/wilayah?type=kelurahan&kecamatanId=${value.kecamatanId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: KelurahanOption[]) => {
        setKelurahanList(data);
        if (value.kelurahanId) {
          const found = data.find((k) => k.id === value.kelurahanId);
          if (found) setSelectedKelurahan(found);
        }
      });
    // ambil info kecamatan untuk display label
    if (value.provinsiId && value.kabupatenId) {
      // sudah ada hierarchy info dari parent — tidak perlu refetch
    }
  }, [value.kecamatanId, value.kelurahanId, value.provinsiId, value.kabupatenId, selectedKecamatan?.id]);

  // Autosuggest kecamatan: debounce 250ms
  useEffect(() => {
    const q = kecamatanInput.trim();
    if (q.length < 2) { setKecamatanOptions([]); return; }
    setKecamatanLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/wilayah?type=kecamatan&search=${encodeURIComponent(q)}`)
        .then((r) => r.ok ? r.json() : [])
        .then((d) => setKecamatanOptions(Array.isArray(d) ? d : []))
        .catch(() => setKecamatanOptions([]))
        .finally(() => setKecamatanLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [kecamatanInput]);

  function handleKecamatanChange(kec: KecamatanOption | null) {
    setSelectedKecamatan(kec);
    setSelectedKelurahan(null);
    if (!kec) {
      setKelurahanList([]);
      onChange({ provinsiId: null, kabupatenId: null, kecamatanId: null, kelurahanId: null });
      return;
    }
    onChange({
      provinsiId: kec.provinsi_id,
      kabupatenId: kec.kabupaten_id,
      kecamatanId: kec.id,
      kelurahanId: null,
    });
    fetch(`/api/wilayah?type=kelurahan&kecamatanId=${kec.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((d: KelurahanOption[]) => setKelurahanList(d));
  }

  function handleKelurahanChange(kel: KelurahanOption | null) {
    setSelectedKelurahan(kel);
    onChange({ ...value, kelurahanId: kel?.id ?? null });
  }

  // Display value untuk Autocomplete kecamatan saat mode edit (id sudah ada tapi options belum loaded)
  const kecamatanDisplay = selectedKecamatan ?? (
    value.kecamatanId
      ? {
          id: value.kecamatanId,
          name: initialLabels?.kecamatan ?? "",
          kabupaten_id: value.kabupatenId ?? 0,
          kabupaten: initialLabels?.kabupaten ?? "",
          provinsi_id: value.provinsiId ?? 0,
          provinsi: initialLabels?.provinsi ?? "",
        }
      : null
  );

  // Provinsi/Kabupaten display: dari selectedKecamatan (saat user pilih) atau initialLabels (mode edit)
  const provinsiDisplay = selectedKecamatan?.provinsi ?? initialLabels?.provinsi ?? "";
  const kabupatenDisplay = selectedKecamatan?.kabupaten ?? initialLabels?.kabupaten ?? "";

  return (
    <Grid container spacing={2}>
      {/* Kecamatan: autosuggest global */}
      <Grid item xs={12}>
        <Autocomplete
          value={kecamatanDisplay}
          onChange={(_, v) => handleKecamatanChange(v)}
          inputValue={kecamatanInput}
          onInputChange={(_, v) => setKecamatanInput(v)}
          options={kecamatanOptions}
          loading={kecamatanLoading}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(x) => x}
          disabled={disabled}
          noOptionsText={kecamatanInput.length < 2 ? "Ketik min 2 karakter" : "Tidak ditemukan"}
          renderOption={(props, o) => (
            <li {...props} key={o.id}>
              <Box>
                <Typography variant="body2">{o.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {o.kabupaten}, {o.provinsi}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Kecamatan"
              size="small"
              placeholder="Ketik nama kecamatan…"
              helperText="Pilih kecamatan terlebih dahulu — provinsi & kabupaten otomatis terisi"
            />
          )}
        />
      </Grid>

      {/* Provinsi: disabled, auto-fill */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Provinsi"
          size="small"
          fullWidth
          value={provinsiDisplay}
          disabled
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Kabupaten: disabled, auto-fill */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Kabupaten/Kota"
          size="small"
          fullWidth
          value={kabupatenDisplay}
          disabled
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Kelurahan: dropdown sesuai kecamatan terpilih */}
      <Grid item xs={12}>
        <Autocomplete
          options={kelurahanList}
          getOptionLabel={(o) => o.name}
          value={selectedKelurahan}
          onChange={(_, v) => handleKelurahanChange(v)}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          disabled={disabled || !value.kecamatanId}
          noOptionsText={value.kecamatanId ? "Tidak ada kelurahan" : "Pilih kecamatan dulu"}
          renderInput={(p) => <TextField {...p} label="Kelurahan" size="small" />}
        />
      </Grid>
    </Grid>
  );
}
