import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { V3PublicService } from './v3-public.js';
import { V3PerformerService } from './v3-performers.js';

const confirmedAssignments = {
  benvao: ['fleshlabasia'],
  cubanuevo: ['fleshlab-twinks-global'],
  dondaddy: ['fleshlab-twinks-global'],
  emjey: ['fleshlabasia', 'fleshlab-bareback-twinks'],
  feli: ['fleshlab-twinks-global', 'fleshlab-bareback-twinks'],
  jameson: ['fleshlabasia', 'fleshlab-bareback-twinks'],
  josh: ['fleshlabasia', 'fleshlab-bareback-twinks'],
  julian: ['fleshlab-bareback-twinks'],
  'kenji-fox': ['fleshlabasia', 'fleshlab-bareback-twinks'],
  kraken: ['fleshlabasia'],
  lollipop: ['fleshlab-twinks-global'],
  'luxe-ryn': ['fleshlab-twinks-global'],
  'the-fitmaster': ['fleshlabasia'],
  tooclose: ['fleshlab-twinks-global'],
  yero: ['fleshlabasia', 'fleshlab-bareback-twinks'],
  zed: ['fleshlabasia', 'fleshlab-bareback-twinks']
};

const confirmedNames = {
  benvao: 'Benvao', cubanuevo: 'Cubanuevo', dondaddy: 'Dondaddy', emjey: 'Emjey',
  feli: 'Feli', jameson: 'Jameson', josh: 'Joshh', julian: 'Julian',
  'kenji-fox': 'Kenji Fox', kraken: 'Kraken', lollipop: 'Lollipop', 'luxe-ryn': 'Luxe Ryn',
  'the-fitmaster': 'The Fitmaster', tooclose: 'TooClose', yero: 'Yero', zed: 'ZE[D]'
};
const regexQuote = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('0033 seeds the 16 canonical performer label assignments without destructive SQL', async () => {
  const sql = await fs.readFile(new URL('../migrations/0033_v3_performer_label_affiliations.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS v3_performer_brand_affiliations/);
  assert.match(sql, /FLESHLAB TWINKS GLOBAL/);
  assert.match(sql, /FLESHLAB BAREBACK TWINKS/);
  assert.doesNotMatch(sql, /FLESHLAB TWINK GLOBAL/);
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|DATABASE)|\bDELETE\s+FROM/i);
  assert.equal(Object.values(confirmedAssignments).flat().length, 23);
  for (const [performerSlug, labels] of Object.entries(confirmedAssignments)) {
    for (const labelSlug of labels) assert.match(sql, new RegExp(`\\('${performerSlug}','${labelSlug}'\\)`));
  }
  for (const [performerSlug, displayName] of Object.entries(confirmedNames)) {
    assert.match(sql, new RegExp(`\\('${regexQuote(performerSlug)}','${regexQuote(displayName)}'\\)`));
  }
});

test('public performer filtering is relational and returns safe label projections', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    if (sql.includes('count(*)')) return { rows: [{ total: 1 }] };
    return { rows: [{ id: 'performer-1', display_name: 'Emjey', public_location: 'Cordon, Philippines', labels: [{ id: 'label-a', name: 'FLESHLAB ASIA', slug: 'fleshlabasia' }, { id: 'label-b', name: 'FLESHLAB BAREBACK TWINKS', slug: 'fleshlab-bareback-twinks' }] }] };
  } };
  const result = await new V3PublicService(db).performers({ label: 'fleshlab-bareback-twinks' });
  assert.equal(result.records[0].labels.length, 2);
  assert.equal(result.records[0].public_location, 'Cordon, Philippines');
  assert.equal(calls[0].values[0], 'fleshlab-bareback-twinks');
  assert.match(calls[0].sql, /v3_performer_brand_affiliations/);
  assert.match(calls[0].sql, /affiliation_status='active'/);
});

test('admin performer operations filter and project relational labels', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    if (sql.includes('count(*)')) return { rows: [{ total: 1 }] };
    return { rows: [{ legacy_id: 'p-1', display_name: 'Emjey', labels: [{ name: 'FLESHLAB ASIA' }] }] };
  } };
  const result = await new V3PerformerService(db).list({ label: 'fleshlabasia' });
  assert.equal(result.records[0].labels[0].name, 'FLESHLAB ASIA');
  assert.equal(calls[0].values[0], 'fleshlabasia');
  assert.match(calls[0].sql, /v3_performer_brand_affiliations/);
  assert.match(calls[1].sql, /AS labels/);
});

test('public terminology uses performers and exposes label affiliation without private contract data', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  assert.match(source, /FLESHLAB PERFORMERS/);
  assert.match(source, /LABEL AFFILIATION/);
  assert.doesNotMatch(source, /THE PEOPLE|PEOPLE OF FLESHLAB/);
  assert.doesNotMatch(source, /contract_instance_id|contract_number|internal_admin_notes/);
});
