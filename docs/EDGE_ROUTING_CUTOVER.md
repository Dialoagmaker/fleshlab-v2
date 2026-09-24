# FLESHLAB Edge Routing Cutover

This change prepares the existing `fleshlab-prod-vm` Caddy edge for a
reversible main-domain cutover. It does not itself change DNS, Cloudflare
Worker routes, or the running Caddy container.

## Intended routing

- `fleshlab.online/v3`, `fleshlab.online/v3/*`,
  `fleshlab.online/api/v3`, and `fleshlab.online/api/v3/*` route to the V3
  Azure origin `fleshlab-test-233ab.eastus.cloudapp.azure.com` with strict
  upstream TLS verification and that hostname as both SNI and `Host`.
- All other `fleshlab.online` paths route to the Render ingress `216.24.57.1`
  with strict TLS verification, SNI `fleshlab.online`, and upstream `Host`
  `fleshlab.online`.
- `earn.fleshlab.online` remains on the local V3 API/web services.

## Worker decision

The legacy `fleshlab.online/api/*` route runs the `fleshlab-api-gateway`
Worker, which forwards legacy V2 function calls to the Base44 backend. It is
required for the current V2 API surface and must remain in place.

Before DNS cutover, the two more-specific V3 routes must be changed to
no-script bypass routes so the legacy `/api/*` Worker cannot intercept
`/api/v3/*`. Their current IDs are:

- `c580d637097a4932bba23132aab35c9c` — `/v3/*`
- `db175eaa860b46279b92c48f479863d2` — `/api/v3/*`

The `/api/*` route remains:

- `7a63d631623c44528738182f676fc1d6`

## Rollback

Restore the apex proxied A record to `216.24.57.1`, restore the prior
Caddyfile from the pre-cutover snapshot, and restore the two V3 Worker routes
to their recorded script bindings. The pre-cutover VM snapshot is stored at:

`/opt/fleshlab/backups/edge-pre-v3-routing-20260924T145613Z`

The public DNS snapshot and Worker route JSON from the same operation are
also retained in the local cutover evidence directory used for the change.

The cutover is not complete until a Cloudflare Origin CA certificate for
`fleshlab.online` is installed at `/opt/fleshlab/secrets/origin-ca` and
Cloudflare Full (strict) is confirmed.
