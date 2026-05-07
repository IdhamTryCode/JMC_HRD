import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // --- transport_settings ---
  await knex.schema.createTable("transport_settings", (t) => {
    t.increments("id").primary();
    t.decimal("base_fare_per_km", 12, 2).notNullable();
    t.date("effective_from").notNullable();
    t.integer("created_by").nullable().references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.index("effective_from");
  });

  // --- transport_allowances ---
  await knex.schema.createTable("transport_allowances", (t) => {
    t.increments("id").primary();
    t.integer("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.smallint("period_year").notNullable();
    t.smallint("period_month").notNullable();
    t.decimal("distance_km_raw", 6, 2).notNullable();
    t.smallint("distance_km_used").notNullable();
    t.smallint("working_days").notNullable();
    t.decimal("base_fare", 12, 2).notNullable();
    t.decimal("amount", 14, 2).notNullable();
    t.boolean("eligible").notNullable();
    t.string("reason", 200).nullable();
    t.timestamp("computed_at", { useTz: true }).defaultTo(knex.fn.now());
    t.unique(["employee_id", "period_year", "period_month"]);
  });

  // --- leave_quotas ---
  await knex.schema.createTable("leave_quotas", (t) => {
    t.increments("id").primary();
    t.integer("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.smallint("year").notNullable();
    t.decimal("cuti_quota", 4, 1).defaultTo(12);
    t.decimal("izin_quota", 4, 1).defaultTo(12);
    t.decimal("unpaid_leave_quota", 4, 1).defaultTo(3);
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    t.unique(["employee_id", "year"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("leave_quotas");
  await knex.schema.dropTableIfExists("transport_allowances");
  await knex.schema.dropTableIfExists("transport_settings");
}
