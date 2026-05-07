"use client";

import { useState, useEffect } from "react";
import { Autocomplete, TextField, Grid } from "@mui/material";

type Option = { id: number; name: string; kabupaten?: string };

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
  disabled?: boolean;
};

async function fetchWilayah(type: string, parentId?: number): Promise<Option[]> {
  const params = new URLSearchParams({ type });
  if (parentId) {
    if (type === "kabupaten") params.set("provinsiId", String(parentId));
    if (type === "kecamatan") params.set("kabupatenId", String(parentId));
    if (type === "kelurahan") params.set("kecamatanId", String(parentId));
  }
  const res = await fetch(`/api/wilayah?${params}`);
  return res.ok ? res.json() : [];
}

export default function WilayahSelect({ value, onChange, disabled }: Props) {
  const [provinsiList, setProvinsiList] = useState<Option[]>([]);
  const [kabupatenList, setKabupatenList] = useState<Option[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Option[]>([]);
  const [kelurahanList, setKelurahanList] = useState<Option[]>([]);

  useEffect(() => { fetchWilayah("provinsi").then(setProvinsiList); }, []);

  useEffect(() => {
    if (value.provinsiId) fetchWilayah("kabupaten", value.provinsiId).then(setKabupatenList);
    else setKabupatenList([]);
  }, [value.provinsiId]);

  useEffect(() => {
    if (value.kabupatenId) fetchWilayah("kecamatan", value.kabupatenId).then(setKecamatanList);
    else setKecamatanList([]);
  }, [value.kabupatenId]);

  useEffect(() => {
    if (value.kecamatanId) fetchWilayah("kelurahan", value.kecamatanId).then(setKelurahanList);
    else setKelurahanList([]);
  }, [value.kecamatanId]);

  function find(list: Option[], id: number | null) {
    return list.find((o) => o.id === id) ?? null;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={provinsiList}
          getOptionLabel={(o) => o.name}
          value={find(provinsiList, value.provinsiId)}
          onChange={(_, v) => onChange({ provinsiId: v?.id ?? null, kabupatenId: null, kecamatanId: null, kelurahanId: null })}
          disabled={disabled}
          renderInput={(p) => <TextField {...p} label="Provinsi" size="small" />}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={kabupatenList}
          getOptionLabel={(o) => o.name}
          value={find(kabupatenList, value.kabupatenId)}
          onChange={(_, v) => onChange({ ...value, kabupatenId: v?.id ?? null, kecamatanId: null, kelurahanId: null })}
          disabled={disabled || !value.provinsiId}
          renderInput={(p) => <TextField {...p} label="Kabupaten/Kota" size="small" />}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={kecamatanList}
          getOptionLabel={(o) => o.kabupaten ? `${o.name} (${o.kabupaten})` : o.name}
          value={find(kecamatanList, value.kecamatanId)}
          onChange={(_, v) => onChange({ ...value, kecamatanId: v?.id ?? null, kelurahanId: null })}
          disabled={disabled || !value.kabupatenId}
          renderInput={(p) => <TextField {...p} label="Kecamatan" size="small" />}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={kelurahanList}
          getOptionLabel={(o) => o.name}
          value={find(kelurahanList, value.kelurahanId)}
          onChange={(_, v) => onChange({ ...value, kelurahanId: v?.id ?? null })}
          disabled={disabled || !value.kecamatanId}
          renderInput={(p) => <TextField {...p} label="Kelurahan" size="small" />}
        />
      </Grid>
    </Grid>
  );
}
