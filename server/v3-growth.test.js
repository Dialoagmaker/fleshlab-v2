import test from 'node:test';
import assert from 'node:assert/strict';
import { V3GrowthService } from './v3-growth.js';

const admin = { id: 'admin-1', role: 'admin' };

test('Growth UTM generation preserves the destination and never adds secrets', async () => {
  const calls = [];
  const db = { query: async (sql, values = []) => { calls.push({ sql, values }); return { rows: [], rowCount: 0 }; } };
  const result = await new V3GrowthService(db, {}).generateUtm({ destination: '/become-performer', source: 'social', medium: 'paid', campaign: 'spring', content: 'hero' }, admin, { headers: {} });
  assert.equal(result.url, '/become-performer?utm_source=social&utm_medium=paid&utm_campaign=spring&utm_content=hero');
  assert.equal(result.url.includes('secret'), false);
  assert.match(calls.at(-1).sql, /growth/);
});

test('Growth campaign validation rejects unsafe destinations and unsupported taxonomy', async () => {
  const service = new V3GrowthService({ query: async () => ({ rows: [], rowCount: 0 }) });
  await assert.rejects(() => service.saveCampaign(null, { name: 'Test', internal_reference: 'test', campaign_type: 'unknown', target_destination: '/' }, admin), { code: 'CAMPAIGN_INVALID' });
  await assert.rejects(() => service.saveCampaign(null, { name: 'Test', internal_reference: 'test', campaign_type: 'recruitment', target_destination: 'javascript:alert(1)' }, admin), { code: 'INVALID_URL' });
});

test('Growth funnels return UNKNOWN when the corresponding event data is absent', async () => {
  const db = { query: async sql => {
    if (sql.includes('FROM v3_growth_funnels')) return { rows: [{ funnel_key: 'campaign_application', name: 'Campaign', description: 'Grounded', steps: [{ key: 'landing', label: 'Landing' }, { key: 'application', label: 'Application' }] }] };
    return { rows: [{ count: 0 }] };
  } };
  const result = await new V3GrowthService(db).funnels();
  assert.equal(result.funnels[0].steps[0].state, 'UNKNOWN');
  assert.equal(result.funnels[0].steps[0].count, null);
  assert.equal(result.funnels[0].steps[1].state, 'UNKNOWN');
});

test('Growth audit projections redact secret-shaped metadata', async () => {
  const calls = [];
  const db = { query: async (sql, values = []) => { calls.push({ sql, values }); return { rows: [{ id: 'campaign-1' }], rowCount: 1 }; } };
  await new V3GrowthService(db).saveCampaign(null, { name: 'Recruiting', internal_reference: 'recruiting', campaign_type: 'recruitment', channels: ['website'] }, admin);
  const audit = calls.find(call => call.sql.includes('v3_audit_events'));
  assert.ok(audit);
  assert.equal(JSON.stringify(audit.values).includes('password'), false);
});

test('creator and performer roles do not receive Growth permissions', async () => {
  const { hasPermission } = await import('./v3-system.js');
  assert.equal(hasPermission({ role: 'performer' }, 'growth.read'), false);
  assert.equal(hasPermission({ role: 'customer' }, 'growth.read'), false);
  assert.equal(hasPermission({ role: 'staff' }, 'growth.read'), true);
  assert.equal(hasPermission({ role: 'staff' }, 'growth.campaigns'), false);
  assert.equal(hasPermission({ role: 'admin' }, 'growth.publish'), true);
});
