/**
 * Canonical performer identifier handling shared by the Admin client and API.
 *
 * Historical records use both raw UUIDs and the v3:<uuid> form.  Keep both
 * candidates when resolving so old bookmarks and new list links address the
 * same catalog performer without rewriting ownership data.
 */
export function normalizePerformerId(value) {
  if (value == null) return '';
  let result = String(value).trim();
  try { result = decodeURIComponent(result); } catch { /* keep the original value */ }
  return result;
}

export function performerIdCandidates(value) {
  const normalized = normalizePerformerId(value);
  if (!normalized) return [];
  const candidates = [normalized];
  if (normalized.startsWith('v3:')) {
    const raw = normalized.slice(3);
    if (raw) candidates.push(raw);
  } else if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(normalized)) {
    candidates.push(`v3:${normalized}`);
  }
  return [...new Set(candidates)];
}

export const performerTabAliases = Object.freeze({
  overview: 'Overview',
  account: 'Overview',
  profile: 'Overview',
  compliance: 'Contracts & Compliance',
  contracts: 'Contracts & Compliance',
  media: 'Content',
  videos: 'Content',
  production: 'Productions',
  productions: 'Productions',
  earnings: 'Earnings'
});

export function normalizePerformerTab(value) {
  const key = String(value || '').trim().toLowerCase();
  return performerTabAliases[key] || 'Overview';
}
