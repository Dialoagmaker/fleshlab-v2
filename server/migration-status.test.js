import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { compareMigrationStatus, readMigrationStatus } from './migration-status.js';

test('compares sorted on-disk migrations against applied ledger versions', () => {
  assert.deepEqual(compareMigrationStatus(['0049.sql', '0001.sql', 'notes.txt'], ['0001.sql']), {
    records: [{ file: '0001.sql', status: 'APPLIED' }, { file: '0049.sql', status: 'PENDING' }],
    pending_count: 1
  });
});

test('reads only the migration ledger and never creates it', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'fleshlab-migration-status-'));
  const calls = [];
  try {
    await fs.writeFile(path.join(directory, '0001_example.sql'), '-- migration');
    await fs.writeFile(path.join(directory, '0002_example.sql'), '-- migration');
    const status = await readMigrationStatus({
      directory,
      db: { query: async sql => { calls.push(sql); return { rows: [{ version: '0001_example.sql' }] }; } }
    });
    assert.deepEqual(status, {
      ledger_found: true,
      records: [{ file: '0001_example.sql', status: 'APPLIED' }, { file: '0002_example.sql', status: 'PENDING' }],
      pending_count: 1
    });
    assert.deepEqual(calls, ['SELECT version FROM schema_migrations ORDER BY version']);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('reports a missing migration ledger without creating or changing anything', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'fleshlab-migration-status-missing-'));
  const calls = [];
  try {
    await fs.writeFile(path.join(directory, '0001_example.sql'), '-- migration');
    const status = await readMigrationStatus({
      directory,
      db: { query: async sql => { calls.push(sql); const error = new Error('missing relation'); error.code = '42P01'; throw error; } }
    });
    assert.deepEqual(status, { ledger_found: false, records: [], pending_count: null });
    assert.deepEqual(calls, ['SELECT version FROM schema_migrations ORDER BY version']);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
