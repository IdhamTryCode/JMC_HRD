// Row types manual untuk Knex — snake_case matching kolom DB.
// Convert ke camelCase di service/API layer pakai helper di lib/case.ts.

export type ID = number;
export type Timestamp = Date;

// --- Auth ---

export interface RoleRow {
  id: ID;
  name: "superadmin" | "manager_hrd" | "admin_hrd";
  description: string | null;
  created_at: Timestamp;
}

export interface UserRow {
  id: ID;
  employee_id: ID | null;
  role_id: ID;
  username: string;
  password_hash: string;
  is_active: boolean;
  last_login_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface UserSessionRow {
  id: ID;
  user_id: ID;
  token_hash: string;
  remember_me: boolean;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Timestamp;
  revoked_at: Timestamp | null;
  created_at: Timestamp;
}

export interface OtpTokenRow {
  id: ID;
  user_id: ID;
  code_hash: string;
  purpose: "login" | "reset_password";
  expires_at: Timestamp;
  consumed_at: Timestamp | null;
  attempts: number;
  created_at: Timestamp;
}

// --- Wilayah ---

export interface ProvinsiRow {
  id: number;
  name: string;
}

export interface KabupatenRow {
  id: number;
  name: string;
  provinsi_id: number;
}

export interface KecamatanRow {
  id: number;
  name: string;
  kabupaten_id: number;
}

export interface KelurahanRow {
  id: number;
  name: string;
  kecamatan_id: number;
}

// --- Master ---

export interface PositionRow {
  id: ID;
  name: string;
}

export interface DepartmentRow {
  id: ID;
  name: string;
}

export interface OfficeRow {
  id: ID;
  name: string;
  latitude: string; // Knex returns decimal as string
  longitude: string;
}

// --- Employees ---

export type EmploymentType = "kontrak" | "tetap" | "magang";
export type MaritalStatus = "kawin" | "tidak_kawin";
export type Gender = "pria" | "wanita";

export interface EmployeeRow {
  id: ID;
  nip: string;
  full_name: string;
  email: string;
  phone: string;
  photo_path: string | null;
  address_kelurahan_id: ID | null;
  address_detail: string | null;
  latitude: string | null;
  longitude: string | null;
  birth_kabupaten_id: ID | null;
  birth_date: Date | null;
  marital_status: MaritalStatus | null;
  children_count: number;
  join_date: Date;
  position_id: ID;
  department_id: ID;
  employment_type: EmploymentType;
  gender: Gender | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface EmployeeEducationRow {
  id: ID;
  employee_id: ID;
  level: string;
  institution: string;
  major: string | null;
  year_start: number | null;
  year_end: number | null;
  sort_order: number;
}

// --- Tunjangan ---

export interface TransportSettingRow {
  id: ID;
  base_fare_per_km: string;
  effective_from: Date;
  created_by: ID | null;
  created_at: Timestamp;
}

export interface TransportAllowanceRow {
  id: ID;
  employee_id: ID;
  period_year: number;
  period_month: number;
  distance_km_raw: string;
  distance_km_used: number;
  working_days: number;
  base_fare: string;
  amount: string;
  eligible: boolean;
  reason: string | null;
  computed_at: Timestamp;
}

export interface LeaveQuotaRow {
  id: ID;
  employee_id: ID;
  year: number;
  cuti_quota: string;
  izin_quota: string;
  unpaid_leave_quota: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// --- Presensi ---

export type AttendanceKind = "hadir" | "cuti" | "izin" | "unpaid_leave";
export type AttendanceStatus = "terpenuhi" | "tidak_terpenuhi";
export type VerificationStatus = "pending" | "disetujui" | "ditolak";
export type VerifierRole = "lead" | "manager" | "hrd";
export type AttendanceSource = "import_excel" | "manual";
export type ImportStatus = "queued" | "processing" | "done" | "failed";

export interface AttendanceRow {
  id: ID;
  employee_id: ID;
  date: Date;
  check_in_at: Timestamp | null;
  check_out_at: Timestamp | null;
  check_in_office_id: ID | null;
  check_out_office_id: ID | null;
  kehadiran: AttendanceKind;
  duration_hours: string;
  status: AttendanceStatus;
  late_minutes: number;
  is_halfday: boolean;
  verifikasi: VerificationStatus;
  verifikator: VerifierRole | null;
  verifikator_user_id: ID | null;
  keterangan: string | null;
  source: AttendanceSource;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AttendanceImportRow {
  id: ID;
  user_id: ID;
  file_path: string;
  period_year: number;
  period_month: number;
  status: ImportStatus;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  error_log: unknown | null;
  created_at: Timestamp;
  finished_at: Timestamp | null;
}

// --- Audit ---

export interface ActivityLogRow {
  id: ID;
  user_id: ID | null;
  username: string | null;
  action: string;
  module: string;
  description: string | null;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Timestamp;
}
