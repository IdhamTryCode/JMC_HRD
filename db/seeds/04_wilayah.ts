import type { Knex } from "knex";
import https from "https";

const SQL_URL =
  "https://raw.githubusercontent.com/guzfirdaus/Wilayah-Administrasi-Indonesia/refs/heads/master/postgresql/wilayah_indonesia_pg.sql";

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location!).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/** Parse VALUES block of a single INSERT INTO "table" VALUES (...) statement */
function parseInsertValues(sql: string, tableName: string): string[][] {
  const re = new RegExp(
    `INSERT INTO "${tableName}" VALUES\\s*([\\s\\S]*?);(?=\\s*(?:INSERT|DROP|CREATE|--|$))`,
    "g"
  );
  const results: string[][] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(sql)) !== null) {
    const block = match[1];
    // Match each (val, val, ...) tuple
    const rowRe = /\(([^)]+)\)/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRe.exec(block)) !== null) {
      const cols = rowMatch[1].split(",").map((s) =>
        s.trim().replace(/^'|'$/g, "")
      );
      results.push(cols);
    }
  }
  return results;
}

const BATCH = 500;

async function batchInsert<T extends object>(
  knex: Knex,
  table: string,
  rows: T[]
) {
  for (let i = 0; i < rows.length; i += BATCH) {
    await knex(table).insert(rows.slice(i, i + BATCH)).onConflict("id").ignore();
  }
}

export async function seed(knex: Knex): Promise<void> {
  // Skip jika semua level sudah terisi
  const [{ count: kelCount }] = await knex("kelurahan").count<{ count: string }[]>("id as count");
  if (Number(kelCount) > 80000) {
    console.log("  ✓ Wilayah data already seeded, skipping.");
    return;
  }

  console.log("  → Fetching wilayah data from GitHub…");
  const sql = await fetchText(SQL_URL);
  console.log(`  → Downloaded ${(sql.length / 1024).toFixed(0)} KB`);

  // --- Provinsi ---
  const provinces = parseInsertValues(sql, "reg_provinces");
  const provinsiRows = provinces.map(([id, name]) => ({
    id: parseInt(id, 10),
    name: name.trim(),
  }));
  await batchInsert(knex, "provinsi", provinsiRows);
  console.log(`  ✓ provinsi: ${provinsiRows.length} rows`);

  // --- Kabupaten ---
  const regencies = parseInsertValues(sql, "reg_regencies");
  const kabupatenRows = regencies.map(([id, province_id, name]) => ({
    id: parseInt(id, 10),
    provinsi_id: parseInt(province_id, 10),
    name: name.trim(),
  }));
  await batchInsert(knex, "kabupaten", kabupatenRows);
  console.log(`  ✓ kabupaten: ${kabupatenRows.length} rows`);

  // --- Kecamatan ---
  const districts = parseInsertValues(sql, "reg_districts");
  const kecamatanRows = districts.map(([id, regency_id, name]) => ({
    id: parseInt(id, 10),
    kabupaten_id: parseInt(regency_id, 10),
    name: name.trim(),
  }));
  await batchInsert(knex, "kecamatan", kecamatanRows);
  console.log(`  ✓ kecamatan: ${kecamatanRows.length} rows`);

  // --- Kelurahan ---
  // ID kelurahan 10 digit (contoh: 1101012001) — melebihi INT, pakai BigInt
  const villages = parseInsertValues(sql, "reg_villages");
  const kelurahanRows = villages.map(([id, district_id, name]) => ({
    id: BigInt(id.trim()),
    kecamatan_id: parseInt(district_id, 10),
    name: name.trim(),
  }));
  await batchInsert(knex, "kelurahan", kelurahanRows);
  console.log(`  ✓ kelurahan: ${kelurahanRows.length} rows`);
}
