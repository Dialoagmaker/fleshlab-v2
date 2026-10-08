# FLESHLAB Root V3 Cutover / Rollback

## Cutover

- Zone: `fleshlab.online`
- Apex record: `A fleshlab.online`
- Previous value: `216.24.57.1`
- Previous state: proxied
- Cutover value: `20.102.36.202`
- Cutover state: proxied
- V3 origin: `fleshlab-test-233ab.eastus.cloudapp.azure.com`
- Caddy snapshot before cutover: `/opt/fleshlab/backups/caddy-pre-root-cutover-20260926083918.Caddyfile`

The Caddy rule matches only `/` and internally requests `/v3/` from the V3 origin. `/api/v3/*` remains on the V3 origin. Other paths continue to use the Render/V2 fallback.

## Rollback

Restore the Cloudflare A record to `216.24.57.1` with proxying enabled. If the Caddy rule also needs to be reverted, restore the snapshot above and reload Caddy only after validation.

Do not change `earn.fleshlab.online` or the portal host records during rollback.
