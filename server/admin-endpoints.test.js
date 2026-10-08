import test from 'node:test';
import assert from 'node:assert/strict';
import { SYSTEM_TAB_ENDPOINTS, systemEndpointForTab } from '../v3/admin-endpoints.js';

test('every V3 system tab resolves to a concrete API endpoint', () => {
  for (const [tab, endpoint] of Object.entries(SYSTEM_TAB_ENDPOINTS)) {
    assert.match(endpoint, /^\/admin\/system\/[a-z-]+$/);
    assert.equal(systemEndpointForTab(tab), endpoint);
  }
});

test('unknown system tabs fail before an undefined request can be built', () => {
  assert.throws(() => systemEndpointForTab('Unknown tab'), /SYSTEM_TAB_NOT_CONFIGURED/);
});
