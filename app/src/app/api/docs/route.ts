import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "JMC HRD API",
    version: "1.0.0",
    description: "REST API untuk sistem HRD JMC Indonesia",
  },
  servers: [{ url: "/api", description: "API Server" }],
  paths: {
    "/auth/captcha": {
      get: { summary: "Generate captcha baru", tags: ["Auth"], responses: { "200": { description: "SVG captcha dan ID" } } },
    },
    "/auth/login": {
      post: {
        summary: "Request OTP login",
        tags: ["Auth"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { username: { type: "string" }, password: { type: "string" }, captchaId: { type: "string" }, captchaAnswer: { type: "string" } }, required: ["username", "password", "captchaId", "captchaAnswer"] } } } },
        responses: { "200": { description: "OTP dikirim via email" }, "401": { description: "Kredensial salah" } },
      },
    },
    "/auth/otp/verify": {
      post: {
        summary: "Verifikasi OTP dan buat session",
        tags: ["Auth"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { username: { type: "string" }, code: { type: "string" } }, required: ["username", "code"] } } } },
        responses: { "200": { description: "Login berhasil, cookie di-set" } },
      },
    },
    "/auth/logout": {
      post: { summary: "Logout (revoke session)", tags: ["Auth"], responses: { "200": { description: "Logout berhasil" } } },
    },
    "/employees": {
      get: {
        summary: "Daftar pegawai",
        tags: ["Employees"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "positionId", in: "query", schema: { type: "integer" } },
          { name: "departmentId", in: "query", schema: { type: "integer" } },
          { name: "employmentType", in: "query", schema: { type: "string", enum: ["tetap", "kontrak", "magang"] } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
          { name: "masaKerjaOp", in: "query", schema: { type: "string", enum: ["gt", "gte", "lt", "lte", "eq"] } },
          { name: "masaKerjaVal", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "List pegawai dengan paginasi" } },
      },
      post: {
        summary: "Tambah pegawai baru",
        tags: ["Employees"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "201": { description: "Pegawai berhasil ditambahkan" }, "409": { description: "NIP atau email sudah digunakan" } },
      },
    },
    "/employees/{id}": {
      get: { summary: "Detail pegawai", tags: ["Employees"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Data pegawai lengkap dengan pendidikan" } } },
      patch: { summary: "Update pegawai", tags: ["Employees"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Update berhasil" } } },
      delete: { summary: "Hapus pegawai (soft delete)", tags: ["Employees"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Hapus berhasil" } } },
    },
    "/employees/{id}/pdf": {
      get: { summary: "Download PDF pegawai", tags: ["Employees"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "PDF file" } } },
    },
    "/employees/export": {
      get: { summary: "Export Excel semua pegawai", tags: ["Employees"], responses: { "200": { description: "File .xlsx" } } },
    },
    "/attendances": {
      get: {
        summary: "Daftar presensi",
        tags: ["Attendances"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "periodYear", in: "query", schema: { type: "integer" } },
          { name: "periodMonth", in: "query", schema: { type: "integer" } },
          { name: "employeeId", in: "query", schema: { type: "integer" } },
          { name: "kehadiran", in: "query", schema: { type: "string", enum: ["hadir", "cuti", "izin", "unpaid_leave"] } },
          { name: "verifikasi", in: "query", schema: { type: "string", enum: ["pending", "disetujui", "ditolak"] } },
        ],
        responses: { "200": { description: "List presensi dengan paginasi" } },
      },
      post: { summary: "Tambah presensi manual", tags: ["Attendances"], responses: { "201": { description: "Presensi ditambahkan" } } },
    },
    "/attendances/import": {
      post: { summary: "Import presensi dari Excel", tags: ["Attendances"], responses: { "202": { description: "File diterima, proses di background" } } },
    },
    "/attendances/summary": {
      get: { summary: "Ringkasan statistik presensi", tags: ["Attendances"], responses: { "200": { description: "Statistik periode berjalan" } } },
    },
    "/transport-allowances": {
      get: { summary: "Daftar tunjangan transport", tags: ["Transport"], responses: { "200": { description: "List tunjangan dengan paginasi" } } },
    },
    "/transport-allowances/compute": {
      post: { summary: "Hitung tunjangan transport satu periode", tags: ["Transport"], responses: { "200": { description: "Hasil kalkulasi" } } },
    },
    "/transport-settings": {
      get: { summary: "Riwayat setting tarif", tags: ["Transport"], responses: { "200": { description: "List setting" } } },
      post: { summary: "Simpan setting tarif baru", tags: ["Transport"], responses: { "201": { description: "Setting disimpan" } } },
    },
    "/leave-quotas": {
      get: { summary: "Daftar kuota cuti", tags: ["Leave"], responses: { "200": { description: "List kuota per tahun" } } },
      post: { summary: "Simpan/update kuota cuti pegawai", tags: ["Leave"], responses: { "201": { description: "Kuota disimpan" } } },
    },
    "/users": {
      get: { summary: "Daftar pengguna", tags: ["Users"], responses: { "200": { description: "List pengguna" } } },
      post: { summary: "Buat pengguna baru", tags: ["Users"], responses: { "201": { description: "User dibuat, password dikirim via email" } } },
    },
    "/logs": {
      get: { summary: "Log aktivitas sistem", tags: ["Logs"], responses: { "200": { description: "List log" } } },
    },
    "/dashboard/stats": {
      get: { summary: "Statistik dashboard", tags: ["Dashboard"], responses: { "200": { description: "Stats pegawai, presensi, transport" } } },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
