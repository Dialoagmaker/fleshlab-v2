import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('main-domain V3 edge router is limited to V3 routes and keeps a reversible Azure origin', async () => {
  const source = await fs.readFile(new URL('../infra/cloudflare-v3-path-router.js', import.meta.url), 'utf8');
  const config = await fs.readFile(new URL('../infra/wrangler.v3-path-router.toml', import.meta.url), 'utf8');
  assert.match(source, /https:\/\/earn\.fleshlab\.online/);
  assert.match(source, /host-only/);
  assert.match(config, /fleshlab\.online\/v3\/\*/);
  assert.match(config, /fleshlab\.online\/api\/v3\/\*/);
  assert.doesNotMatch(config, /pattern\s*=\s*"fleshlab\.online\/\*"/);
});
