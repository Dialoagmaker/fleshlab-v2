import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { loadConfig } from './config.js';

const config = loadConfig();
if (!config.databaseUrl) throw new Error('A database connection is required for explicit migrations.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'migrations');
const db = new Pool({ connectionString: config.databaseUrl });
const files = (await fs.readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
// The migration ledger must exist before the first migration can be checked.
// Individual schema migrations remain explicit and transactional below.
await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)`);
for (const file of files) {
  const applied = await db.query('SELECT 1 FROM schema_migrations WHERE version=$1', [file]);
  if (applied.rowCount) continue;
  const sql = await fs.readFile(path.join(directory, file), 'utf8');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [file]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
await db.end();
