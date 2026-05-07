"use client";

import { useEffect, useState } from "react";
import { Typography, Alert, Box, CircularProgress } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmployeeForm, { EmployeeFormData } from "@/components/EmployeeForm";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<Partial<EmployeeFormData> | null>(null);
  const [wilayahLabels, setWilayahLabels] = useState<{ kecamatan?: string | null; kabupaten?: string | null; provinsi?: string | null }>({});
  const [empLoading, setEmpLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/employees/${params.id}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Tidak ditemukan"))
      .then((emp) => {
        setInitial({
          nip: emp.nip ?? "",
          fullName: emp.full_name ?? "",
          email: emp.email ?? "",
          phone: emp.phone ?? "",
          positionId: String(emp.position_id ?? ""),
          departmentId: String(emp.department_id ?? ""),
          employmentType: emp.employment_type ?? "",
          gender: emp.gender ?? "",
          birthDate: emp.birth_date ?? "",
          birthKabupaten: emp.birth_kabupaten_id
            ? { id: emp.birth_kabupaten_id, name: emp.birth_kabupaten_name ?? "", provinsi: emp.birth_provinsi_name ?? "" }
            : null,
          maritalStatus: emp.marital_status ?? "",
          childrenCount: String(emp.children_count ?? 0),
          joinDate: emp.join_date ?? "",
          addressDetail: emp.address_detail ?? "",
          latitude: emp.latitude != null ? String(emp.latitude) : "",
          longitude: emp.longitude != null ? String(emp.longitude) : "",
          wilayah: {
            provinsiId: emp.provinsi_id ?? null,
            kabupatenId: emp.kabupaten_id ?? null,
            kecamatanId: emp.kecamatan_id ?? null,
            kelurahanId: emp.address_kelurahan_id ?? null,
          },
          photoPreview: emp.photo_path ?? "",
          photoFile: null,
          educations: (emp.educations ?? []).map((e: { level: string; institution: string; major: string | null; year_start: number | null; year_end: number | null }) => ({
            level: e.level ?? "",
            institution: e.institution ?? "",
            major: e.major ?? "",
            yearStart: String(e.year_start ?? ""),
            yearEnd: String(e.year_end ?? ""),
          })),
        });
        setWilayahLabels({
          kecamatan: emp.kecamatan_name,
          kabupaten: emp.kabupaten_name,
          provinsi: emp.provinsi_name,
        });
      })
      .catch(() => setError("Pegawai tidak ditemukan"))
      .finally(() => setEmpLoading(false));
  }, [params.id]);

  async function handleSubmit(form: EmployeeFormData) {
    setLoading(true);
    setError("");
    try {
      const body = {
        nip: form.nip,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        positionId: Number(form.positionId),
        departmentId: Number(form.departmentId),
        employmentType: form.employmentType,
        gender: form.gender || null,
        birthDate: form.birthDate || null,
        birthKabupatenId: form.birthKabupaten?.id ?? null,
        maritalStatus: form.maritalStatus || null,
        childrenCount: Number(form.childrenCount),
        joinDate: form.joinDate,
        addressKelurahanId: form.wilayah.kelurahanId,
        addressDetail: form.addressDetail || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        educations: form.educations
          .filter((e) => e.level && e.institution)
          .map((e) => ({
            level: e.level,
            institution: e.institution,
            major: e.major || undefined,
            yearStart: e.yearStart ? Number(e.yearStart) : undefined,
            yearEnd: e.yearEnd ? Number(e.yearEnd) : undefined,
          })),
      };

      const res = await fetch(`/api/employees/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");

      if (form.photoFile) {
        const fd = new FormData();
        fd.append("photo", form.photoFile);
        await fetch(`/api/employees/${params.id}/photo`, { method: "POST", body: fd });
      }

      router.push(`/employees/${params.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (empLoading) return <AppShell><CircularProgress /></AppShell>;

  return (
    <AppShell>
      <Typography variant="h5" fontWeight={700} gutterBottom>Edit Pegawai</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ maxWidth: 800 }}>
        {initial && <EmployeeForm initial={initial} initialWilayahLabels={wilayahLabels} onSubmit={handleSubmit} loading={loading} submitLabel="Simpan Perubahan" />}
      </Box>
    </AppShell>
  );
}
