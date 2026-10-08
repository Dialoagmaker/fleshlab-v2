import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Pool } from 'pg';
import { loadConfig } from './config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationDirectory = path.join(root, 'migrations');

export function compareMigrationStatus(files, appliedVersions) {
  const applied = new Set(appliedVersions);
  const records = [...files].filter(file => file.endsWith('.sql')).sort().map(file => ({ file, status: applied.has(file) ? 'APPLIED' : 'PENDING' }));
  return { records, pending_count: records.filter(record => record.status === 'PENDING').length };
}

export async function readMigrationStatus({ db, directory = migrationDirectory } = {}) {
  if (!db || typeof db.query !== 'function') throw new TypeError('A database query interface is required.');
  const files = (await fs.readdir(directory)).filter(file => file.endsWith('.sql')).sort();
  let applied;
  try {
    applied = await db.query('SELECT version FROM schema_migrations ORDER BY version');
  } catch (error) {
    if (error?.code === '42P01') return { ledger_found: false, records: [], pending_count: null };
    throw error;
  }
  return { ledger_found: true, ...compareMigrationStatus(files, applied.rows.map(row => row.version)) };
}

function printStatus(status, output = process.stdout) {
  if (!status.ledger_found) {
    output.write('MIGRATION_LEDGER_NOT_FOUND\n');
    return;
  }
  for (const record of status.records) output.write(`${record.status} ${record.file}\n`);
  output.write(`PENDING_COUNT ${status.pending_count}\n`);
}

async function main() {
  const config = loadConfig();
  if (!config.databaseUrl) {
    process.stdout.write('MIGRATION_STATUS_DATABASE_NOT_CONFIGURED\n');
    process.exitCode = 1;
    return;
  }
  const db = new Pool({ connectionString: config.databaseUrl });
  try {
    const status = await readMigrationStatus({ db });
    printStatus(status);
    if (!status.ledger_found) process.exitCode = 1;
  } finally {
    await db.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`MIGRATION_STATUS_FAILED ${error?.code || 'UNKNOWN'}\n`);
    process.exitCode = 1;
  });
}
