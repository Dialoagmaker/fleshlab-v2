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

test('recruitment events accept only public creator routes and store bounded non-sensitive context', async () => {
  const calls = [];
  const db = { query: async (sql, values = []) => {
    calls.push({ sql, values });
    if (sql.includes('SELECT id FROM v3_growth_campaigns')) return { rows: [{ id: 'campaign-1' }] };
    return { rows: [{ id: 'event-1', occurred_at: '2026-09-26T00:00:00Z' }], rowCount: 1 };
  } };
  const result = await new V3GrowthService(db).recordRecruitmentEvent({ event_type: 'creator_cta_click', landing_route: '/v3/become-a-creator/new-creators', utm_source: 'search', utm_medium: 'organic', utm_campaign: 'creator-global', referrer: 'https://example.test/' });
  assert.equal(result.recorded, true);
  const insert = calls.find(call => call.sql.includes('INSERT INTO v3_growth_events'));
  assert.equal(insert.values[0], 'creator_cta_click');
  assert.equal(insert.values[4], '/v3/become-a-creator/new-creators');
  await assert.rejects(() => new V3GrowthService(db).recordRecruitmentEvent({ event_type: 'creator_cta_click', landing_route: '/admin' }), { code: 'RECRUITMENT_EVENT_INVALID' });
});

test('application attribution sync can be attempted without making the application request depend on Growth', async () => {
  const service = new V3GrowthService({ query: async () => { throw Object.assign(new Error('growth unavailable'), { code: 'GROWTH_UNAVAILABLE' }); } });
  await assert.rejects(() => service.syncApplicationAttribution('application-1'), { code: 'GROWTH_UNAVAILABLE' });
  // The HTTP handler owns the intentionally non-blocking catch around this
  // supplementary call; this assertion documents that the service itself
  // still reports its real failure to the handler.
});

test('public commerce events accept pricing and video routes without expanding metadata collection', async () => {
  const calls = [];
  const db = { query: async (sql, values = []) => { calls.push({ sql, values }); return { rows: [{ id: 'event-1', occurred_at: '2026-09-28T00:00:00Z' }], rowCount: 1 }; } };
  const result = await new V3GrowthService(db).recordRecruitmentEvent({ event_type: 'video_membership_cta_click', landing_route: '/v3/videos/example-title', utm_source: 'organic', referrer: 'https://google.example/' });
  assert.equal(result.recorded, true);
  const insert = calls.find(call => call.sql.includes('INSERT INTO v3_growth_events'));
  assert.equal(insert.values[0], 'video_membership_cta_click');
  assert.equal(insert.values[4], '/v3/videos/example-title');
  assert.equal(insert.values[5].utm_medium, '');
});

test('public journey events retain entity context and external clicks are not paid conversions', async () => {
  const calls = [];
  const db = { query: async (sql, values = []) => { calls.push({ sql, values }); return { rows: [{ id: 'event-1', occurred_at: '2026-09-28T00:00:00Z' }], rowCount: 1 }; } };
  await new V3GrowthService(db).recordRecruitmentEvent({ event_type: 'preview_started', landing_route: '/v3/videos/title', video_id: 'video-1', video_slug: 'title', access_type: 'free_preview' });
  await new V3GrowthService(db).recordRecruitmentEvent({ event_type: 'external_distribution_click', landing_route: '/v3/videos/title', video_id: 'video-1', channel: 'faphouse', destination: 'https://faphouse.example/title' });
  const preview = calls.find(call => call.values[0] === 'preview_started');
  const external = calls.find(call => call.values[0] === 'external_distribution_click');
  assert.equal(preview.values[2], 'video');
  assert.equal(preview.values[3], 'video-1');
  assert.equal(external.values[5].channel, 'faphouse');
  assert.equal(external.values[5].destination, 'https://faphouse.example/title');
  assert.doesNotMatch(external.sql, /conversion|revenue|purchase/i);
});

test('public distribution rejects invalid FapHouse records and keeps title linkage in the existing Growth model', async () => {
  const service = new V3GrowthService({ query: async sql => {
    if (sql.includes('SELECT * FROM v3_growth_distribution_records')) return { rows: [], rowCount: 0 };
    if (sql.includes('SELECT legacy_id FROM catalog_videos')) return { rows: [{ legacy_id: 'video-1' }], rowCount: 1 };
    return { rows: [{ id: 'distribution-1' }], rowCount: 1 };
  } });
  await assert.rejects(() => service.saveDistribution(null, { channel: 'faphouse', status: 'published', video_legacy_id: 'video-1' }, admin), { code: 'DISTRIBUTION_INVALID' });
  const result = await service.saveDistribution(null, { channel: 'faphouse', status: 'published', video_legacy_id: 'video-1', external_url: 'https://faphouse.example/title' }, admin);
  assert.equal(result.id, 'distribution-1');
});

test('creator and performer roles do not receive Growth permissions', async () => {
  const { hasPermission } = await import('./v3-system.js');
  assert.equal(hasPermission({ role: 'performer' }, 'growth.read'), false);
  assert.equal(hasPermission({ role: 'customer' }, 'growth.read'), false);
  assert.equal(hasPermission({ role: 'staff' }, 'growth.read'), true);
  assert.equal(hasPermission({ role: 'staff' }, 'growth.campaigns'), false);
  assert.equal(hasPermission({ role: 'admin' }, 'growth.publish'), true);
});
