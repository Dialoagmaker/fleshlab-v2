import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for explicit migrations.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'migrations');
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const files = (await fs.readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
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
