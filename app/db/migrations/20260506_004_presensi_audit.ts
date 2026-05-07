import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // --- attendances ---
  await knex.schema.createTable("attendances", (t) => {
    t.increments("id").primary();
    t.integer("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.date("date").notNullable();

    t.timestamp("check_in_at", { useTz: true }).nullable();
    t.timestamp("check_out_at", { useTz: true }).nullable();
    t.integer("check_in_office_id").nullable().references("id").inTable("offices").onDelete("SET NULL");
    t.integer("check_out_office_id").nullable().references("id").inTable("offices").onDelete("SET NULL");

    t.specificType("kehadiran", "attendance_kind").defaultTo("hadir");
    t.decimal("duration_hours", 4, 1).defaultTo(0);
    t.specificType("status", "attendance_status").defaultTo("tidak_terpenuhi");
    t.integer("late_minutes").defaultTo(0);
    t.boolean("is_halfday").defaultTo(false);

    t.specificType("verifikasi", "verification_status").defaultTo("pending");
    t.specificType("verifikator", "verifier_role").nullable();
    t.integer("verifikator_user_id").nullable().references("id").inTable("users").onDelete("SET NULL");

    t.text("keterangan").nullable();
    t.specificType("source", "attendance_source").defaultTo("manual");

    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

    t.unique(["employee_id", "date"]);
    t.index("date");
  });

  // --- attendance_imports ---
  await knex.schema.createTable("attendance_imports", (t) => {
    t.increments("id").primary();
    t.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("file_path", 500).notNullable();
    t.smallint("period_year").notNullable();
    t.smallint("period_month").notNullable();
    t.specificType("status", "import_status").defaultTo("queued");
    t.integer("total_rows").defaultTo(0);
    t.integer("success_rows").defaultTo(0);
    t.integer("failed_rows").defaultTo(0);
    t.jsonb("error_log").nullable();
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("finished_at", { useTz: true }).nullable();
  });

  // --- activity_logs ---
  await knex.schema.createTable("activity_logs", (t) => {
    t.increments("id").primary();
    t.integer("user_id").nullable().references("id").inTable("users").onDelete("SET NULL");
    t.string("username", 50).nullable();
    t.string("action", 50).notNullable();
    t.string("module", 50).notNullable();
    t.string("description", 255).nullable();
    t.string("target_type", 50).nullable();
    t.string("target_id", 50).nullable();
    t.string("ip_address", 45).nullable();
    t.string("user_agent", 500).nullable();
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());

    t.index("created_at");
    t.index("user_id");
    t.index("module");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("activity_logs");
  await knex.schema.dropTableIfExists("attendance_imports");
  await knex.schema.dropTableIfExists("attendances");
}
