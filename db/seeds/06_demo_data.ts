import type { Knex } from 'knex';

// Employee IDs: 1=Budi, 2=Sari, 3=Andi, 4=Rina, 5=Dian
// User IDs:     1=superadmin, 2=managerhrd(Budi), 3=adminhrd(Sari)
// Office IDs:   1=Gedung Utama, 2=Gedung A, 3=Gedung B

export async function seed(knex: Knex): Promise<void> {
  await knex('transport_allowances').del();
  await knex('transport_settings').del();
  await knex('leave_quotas').del();
  await knex('attendances').del();
  await knex('employee_educations').del();

  // ── Education ────────────────────────────────────────────────────────────
  await knex('employee_educations').insert([
    // Budi Santoso - Manager HRD
    { employee_id: 1, level: 'S1', institution: 'Universitas Indonesia', major: 'Manajemen SDM', year_start: 2010, year_end: 2014, sort_order: 1 },
    { employee_id: 1, level: 'SMA', institution: 'SMA Negeri 1 Jakarta', major: null, year_start: 2007, year_end: 2010, sort_order: 2 },
    // Sari Dewi - Admin HRD
    { employee_id: 2, level: 'S1', institution: 'Universitas Gadjah Mada', major: 'Psikologi', year_start: 2013, year_end: 2017, sort_order: 1 },
    { employee_id: 2, level: 'SMA', institution: 'SMA Negeri 3 Yogyakarta', major: null, year_start: 2010, year_end: 2013, sort_order: 2 },
    // Andi Wijaya - Staf Marketing
    { employee_id: 3, level: 'S1', institution: 'Universitas Diponegoro', major: 'Ilmu Komunikasi', year_start: 2014, year_end: 2018, sort_order: 1 },
    // Rina Kusuma - Staf Production
    { employee_id: 4, level: 'D3', institution: 'Politeknik Negeri Bandung', major: 'Teknik Industri', year_start: 2012, year_end: 2015, sort_order: 1 },
    { employee_id: 4, level: 'S1', institution: 'Universitas Padjadjaran', major: 'Teknik Industri', year_start: 2015, year_end: 2019, sort_order: 2 },
    // Dian Pratama - Magang
    { employee_id: 5, level: 'S1', institution: 'Universitas Brawijaya', major: 'Manajemen', year_start: 2022, year_end: null, sort_order: 1 },
  ]);

  // ── Leave Quotas (2025 & 2026) ────────────────────────────────────────────
  const leaveQuotas = [];
  for (const year of [2025, 2026]) {
    for (const employeeId of [1, 2, 3, 4]) {
      leaveQuotas.push({
        employee_id: employeeId,
        year,
        cuti_quota: 12,
        izin_quota: 12,
        unpaid_leave_quota: 3,
      });
    }
    // magang dapat kuota lebih kecil
    leaveQuotas.push({
      employee_id: 5,
      year,
      cuti_quota: 6,
      izin_quota: 6,
      unpaid_leave_quota: 1,
    });
  }
  await knex('leave_quotas').insert(leaveQuotas);

  // ── Transport Settings ────────────────────────────────────────────────────
  await knex('transport_settings').insert([
    { base_fare_per_km: 2500, effective_from: '2024-01-01', created_by: 1 },
    { base_fare_per_km: 3000, effective_from: '2025-01-01', created_by: 1 },
  ]);

  // ── Transport Allowances ──────────────────────────────────────────────────
  // Budi: 15km, Sari: 8km, Andi: 3km (tidak eligible), Rina: 22km, Dian: 6km
  const employeeDistances: Record<number, number> = { 1: 15, 2: 8, 3: 3, 4: 22, 5: 6 };
  const baseFare = 3000;
  const transportAllowances = [];

  for (const month of [1, 2, 3, 4]) {
    const workingDays = [22, 20, 21, 22][month - 1];
    const periodYear = 2026;

    for (const [empId, distRaw] of Object.entries(employeeDistances)) {
      const employeeId = Number(empId);
      const distUsed = Math.min(distRaw, 25);
      const eligible = distRaw > 5 && workingDays >= 19;
      const amount = eligible ? baseFare * distUsed * workingDays : 0;

      transportAllowances.push({
        employee_id: employeeId,
        period_year: periodYear,
        period_month: month,
        distance_km_raw: distRaw,
        distance_km_used: distUsed,
        working_days: workingDays,
        base_fare: baseFare,
        amount,
        eligible,
        reason: !eligible ? (distRaw <= 5 ? 'Jarak tempuh ≤ 5 km' : 'Hari kerja < 19') : null,
      });
    }
  }
  await knex('transport_allowances').insert(transportAllowances);

  // ── Attendances ───────────────────────────────────────────────────────────
  const attendances = [];
  const now = new Date('2026-05-07');

  // Generate working days for the past 3 months
  const months = [
    { year: 2026, month: 2 },
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
  ];

  const scenarios: Record<number, { pattern: string; office: number }> = {
    1: { pattern: 'rajin',    office: 1 }, // Budi - jarang telat
    2: { pattern: 'normal',   office: 1 }, // Sari - kadang telat
    3: { pattern: 'sering_izin', office: 2 }, // Andi - sering izin
    4: { pattern: 'rajin',    office: 3 }, // Rina - rajin
    5: { pattern: 'magang',   office: 1 }, // Dian - magang, sering izin
  };

  for (const { year, month } of months) {
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      if (date > now) continue;
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekend

      const dateStr = date.toISOString().split('T')[0];

      for (const [empIdStr, { pattern, office }] of Object.entries(scenarios)) {
        const employeeId = Number(empIdStr);
        const rand = Math.random();

        let kehadiran: string = 'hadir';
        let checkIn: string | null = null;
        let checkOut: string | null = null;
        let lateMinutes = 0;
        let durationHours = 0;
        let status = 'terpenuhi';
        let verifikasi = 'disetujui';
        let verifikatorRole: string | null = 'hrd';
        let verifikatorUserId: number | null = 3;

        if (pattern === 'rajin') {
          if (rand < 0.05) {
            kehadiran = 'cuti';
            verifikasi = 'disetujui';
          } else if (rand < 0.08) {
            kehadiran = 'izin';
            verifikasi = 'disetujui';
          } else {
            const lateChance = Math.random();
            lateMinutes = lateChance < 0.1 ? Math.floor(Math.random() * 20) + 1 : 0;
            checkIn = `${dateStr}T0${lateMinutes > 0 ? '8' : '8'}:${String(lateMinutes).padStart(2, '0')}:00+07:00`;
            checkOut = `${dateStr}T17:30:00+07:00`;
            durationHours = 8;
            status = lateMinutes > 30 ? 'tidak_terpenuhi' : 'terpenuhi';
          }
        } else if (pattern === 'normal') {
          if (rand < 0.08) {
            kehadiran = 'cuti';
          } else if (rand < 0.15) {
            kehadiran = 'izin';
          } else {
            lateMinutes = rand < 0.25 ? Math.floor(Math.random() * 45) + 5 : 0;
            checkIn = `${dateStr}T08:${String(lateMinutes).padStart(2, '0')}:00+07:00`;
            checkOut = `${dateStr}T17:${Math.random() < 0.3 ? '00' : '30'}:00+07:00`;
            durationHours = 8;
            status = lateMinutes > 30 ? 'tidak_terpenuhi' : 'terpenuhi';
          }
        } else if (pattern === 'sering_izin') {
          if (rand < 0.15) {
            kehadiran = 'izin';
          } else if (rand < 0.2) {
            kehadiran = 'unpaid_leave';
          } else {
            lateMinutes = rand < 0.3 ? Math.floor(Math.random() * 60) + 10 : 0;
            checkIn = `${dateStr}T08:${String(lateMinutes).padStart(2, '0')}:00+07:00`;
            checkOut = `${dateStr}T17:00:00+07:00`;
            durationHours = 8;
            status = lateMinutes > 30 ? 'tidak_terpenuhi' : 'terpenuhi';
          }
        } else if (pattern === 'magang') {
          if (rand < 0.2) {
            kehadiran = 'izin';
          } else {
            lateMinutes = rand < 0.35 ? Math.floor(Math.random() * 30) + 5 : 0;
            checkIn = `${dateStr}T08:${String(lateMinutes).padStart(2, '0')}:00+07:00`;
            checkOut = `${dateStr}T17:00:00+07:00`;
            durationHours = 8;
            status = lateMinutes > 30 ? 'tidak_terpenuhi' : 'terpenuhi';
          }
        }

        // Beberapa record biarkan pending untuk demo approval workflow
        if (month === 4 && day > 20 && Math.random() < 0.3) {
          verifikasi = 'pending';
          verifikatorRole = null;
          verifikatorUserId = null;
        }

        attendances.push({
          employee_id: employeeId,
          date: dateStr,
          check_in_at: checkIn,
          check_out_at: checkOut,
          check_in_office_id: checkIn ? office : null,
          check_out_office_id: checkOut ? office : null,
          kehadiran,
          duration_hours: durationHours,
          status,
          late_minutes: lateMinutes,
          is_halfday: false,
          verifikasi,
          verifikator: verifikatorRole,
          verifikator_user_id: verifikatorUserId,
          keterangan: kehadiran !== 'hadir' ? `${kehadiran === 'cuti' ? 'Cuti tahunan' : kehadiran === 'izin' ? 'Izin keperluan pribadi' : 'Tanpa keterangan'}` : null,
          source: 'manual',
        });
      }
    }
  }

  await knex('attendances').insert(attendances);
}
