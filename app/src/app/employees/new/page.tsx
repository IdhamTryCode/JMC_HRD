"use client";

import { useState } from "react";
import { Typography, Alert, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmployeeForm, { EmployeeFormData } from "@/components/EmployeeForm";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        gender: form.gender || undefined,
        birthDate: form.birthDate || undefined,
        maritalStatus: form.maritalStatus || undefined,
        childrenCount: Number(form.childrenCount),
        joinDate: form.joinDate,
        addressKelurahanId: form.wilayah.kelurahanId ?? undefined,
        addressDetail: form.addressDetail || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
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

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");

      // Upload foto kalau ada
      if (form.photoFile && data.id) {
        const fd = new FormData();
        fd.append("photo", form.photoFile);
        await fetch(`/api/employees/${data.id}/photo`, { method: "POST", body: fd });
      }

      router.push(`/employees/${data.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Tambah Pegawai
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ maxWidth: 800 }}>
        <EmployeeForm onSubmit={handleSubmit} loading={loading} submitLabel="Tambah Pegawai" />
      </Box>
    </AppShell>
  );
}
