import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // --- employees ---
  await knex.schema.createTable("employees", (t) => {
    t.increments("id").primary();
    t.string("nip", 20).notNullable().unique();
    t.string("full_name", 150).notNullable();
    t.string("email", 150).notNullable().unique();
    t.string("phone", 20).notNullable();
    t.string("photo_path", 255).nullable();

    t.integer("address_kelurahan_id").nullable().references("id").inTable("kelurahan").onDelete("SET NULL");
    t.text("address_detail").nullable();
    t.decimal("latitude", 10, 7).nullable();
    t.decimal("longitude", 10, 7).nullable();

    t.integer("birth_kabupaten_id").nullable().references("id").inTable("kabupaten").onDelete("SET NULL");
    t.date("birth_date").nullable();
    t.specificType("marital_status", "marital_status").nullable();
    t.smallint("children_count").defaultTo(0);

    t.date("join_date").notNullable();
    t.integer("position_id").notNullable().references("id").inTable("positions").onDelete("RESTRICT");
    t.integer("department_id").notNullable().references("id").inTable("departments").onDelete("RESTRICT");
    t.specificType("employment_type", "employment_type").notNullable();
    t.specificType("gender", "gender").nullable();

    t.boolean("is_active").defaultTo(true);
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("deleted_at", { useTz: true }).nullable();

    t.index("full_name");
    t.index("nip");
    t.index("employment_type");
  });

  // --- employee_educations ---
  await knex.schema.createTable("employee_educations", (t) => {
    t.increments("id").primary();
    t.integer("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.string("level", 50).notNullable();
    t.string("institution", 150).notNullable();
    t.string("major", 100).nullable();
    t.smallint("year_start").nullable();
    t.smallint("year_end").nullable();
    t.smallint("sort_order").defaultTo(0);
    t.index("employee_id");
  });

  // --- users ---
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.integer("employee_id").nullable().unique().references("id").inTable("employees").onDelete("SET NULL");
    t.integer("role_id").notNullable().references("id").inTable("roles").onDelete("RESTRICT");
    t.string("username", 50).notNullable().unique();
    t.string("password_hash", 255).notNullable();
    t.boolean("is_active").defaultTo(true);
    t.timestamp("last_login_at", { useTz: true }).nullable();
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("deleted_at", { useTz: true }).nullable();
    t.index("role_id");
  });

  // --- user_sessions ---
  await knex.schema.createTable("user_sessions", (t) => {
    t.increments("id").primary();
    t.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("token_hash", 255).notNullable().unique();
    t.boolean("remember_me").defaultTo(false);
    t.string("ip_address", 45).nullable();
    t.string("user_agent", 500).nullable();
    t.timestamp("expires_at", { useTz: true }).notNullable();
    t.timestamp("revoked_at", { useTz: true }).nullable();
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.index("user_id");
  });

  // --- otp_tokens ---
  await knex.schema.createTable("otp_tokens", (t) => {
    t.increments("id").primary();
    t.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("code_hash", 255).notNullable();
    t.string("purpose", 20).notNullable();
    t.timestamp("expires_at", { useTz: true }).notNullable();
    t.timestamp("consumed_at", { useTz: true }).nullable();
    t.integer("attempts").defaultTo(0);
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.index(["user_id", "purpose"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("otp_tokens");
  await knex.schema.dropTableIfExists("user_sessions");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("employee_educations");
  await knex.schema.dropTableIfExists("employees");
}
