import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('V3 admin navigation does not contain the historical invalid contracts host or undefined API construction', async () => {
  const source = await readFile(new URL('../v3/src/main.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /adminr\.fleshlab\.online/);
  assert.doesNotMatch(source, /apiV3\(path\)\s*$/m);
  assert.match(source, /systemEndpointForTab\(tab\)/);
});

test('V3 contract API remains same-origin and does not depend on a portal DNS alias', async () => {
  const source = await readFile(new URL('../v3/src/main.jsx', import.meta.url), 'utf8');
  assert.match(source, /apiV3\('\/admin\/contracts\/overview'\)/);
  assert.match(source, /apiV3\('\/admin\/contracts\/templates'\)/);
  assert.match(source, /apiV3\('\/admin\/contracts\/assign'/);
});

test('V3 admin navigation groups operational workspaces without changing route targets', async () => {
  const source = await readFile(new URL('../v3/src/main.jsx', import.meta.url), 'utf8');
  assert.match(source, /const ADMIN_NAV_GROUPS/);
  for (const label of ['TODAY', 'PEOPLE', 'CONTENT', 'PRODUCTIONS', 'GROWTH', 'MONEY', 'SETTINGS']) assert.match(source, new RegExp(`label: '${label}'`));
  for (const target of ['Today', 'People', 'Content', 'Productions', 'Growth', 'Money', 'Settings']) assert.match(source, new RegExp(`'${target}'`));
  assert.match(source, /admin-nav-group-toggle/);
  assert.match(source, /aria-expanded/);
});

test('V3 commerce plans expose an edit workflow with customer-facing prices', async () => {
  const source = await readFile(new URL('../v3/src/main.jsx', import.meta.url), 'utf8');
  assert.match(source, /const editPlan=item=>setPlan/);
  assert.match(source, /plan\.id\?'Save changes':'Create plan'/);
  assert.match(source, /onClick=\{\(\)=>editPlan\(item\)\}/);
  assert.match(source, /const \{amount,id,\.\.\.payload\}=plan/);
  assert.match(source, /id\?`\/admin\/commerce\/plans\/\$\{id\}`:'\/admin\/commerce\/plans'/);
});
