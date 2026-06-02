/**
 * Public-safe API utility.
 * All public website pages MUST use this instead of base44.entities.*
 * These functions use service-role internally and return only sanitized public fields.
 */
import { appParams } from '@/lib/app-params';

export async function callPublicFunction(name, payload = {}) {
  const url = `/api/apps/${appParams.appId}/functions/${name}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`${name} failed: ${resp.status}`);
  return resp.json();
}