import test from 'node:test';
import assert from 'node:assert/strict';
import { performerDashboard } from './v3-performer-dashboard.js';

test('performer dashboard composes only the existing ownership-scoped V3 projections', async () => {
  const calls = [];
  const user = { id: 'performer-user' };
  const result = await performerDashboard({
    user,
    creators: { creatorForUser: async actor => { calls.push(['creator', actor]); return { creator: { id: 'creator-1' }, performers: [{ display_name: 'Alex', labels: [] }] }; } },
    submissions: { identity: async actor => { calls.push(['identity', actor]); return { verification: { status: 'approved' }, documents: [] }; }, listForCreator: async actor => { calls.push(['submissions', actor]); return { records: [{ id: 'submission-1' }] }; } },
    contracts: { creatorInstances: async actor => { calls.push(['contracts', actor]); return { records: [{ id: 'contract-1' }] }; } },
    production: { creatorProductions: async actor => { calls.push(['production', actor]); return { records: [{ id: 'production-1' }] }; }, creatorCalendar: async actor => { calls.push(['calendar', actor]); return { records: [{ shoot_id: 'shoot-1' }] }; } },
    commerce: { creatorOverview: async actor => { calls.push(['commerce', actor]); return { historical_data: 'NOT_MIGRATED' }; } },
    compensation: { creatorStatement: async actor => { calls.push(['compensation', actor]); return { records: [], financial_data_state: 'NO_PRODUCTION_FINANCIAL_DATA' }; } }
  });

  assert.equal(result.creator.creator.id, 'creator-1');
  assert.deepEqual(result.submissions, [{ id: 'submission-1' }]);
  assert.deepEqual(result.calendar, [{ shoot_id: 'shoot-1' }]);
  assert.equal(result.data_state.calendar, 'CONFIRMED_EVENTS');
  assert.equal(result.data_state.missions, 'LIVE_V3_MEDIA_AND_SUBMISSIONS');
  assert.equal(result.data_state.ai_producer, 'NOT_CONFIGURED');
  assert.equal(calls.length, 8);
  assert.ok(calls.every(([, actor]) => actor === user));
});
