# Portal Separation Rollback

## Release

- Feature: dedicated Admin and Performer portals
- Source commit: `88c9399` (or the final documentation commit containing this change)
- New release: `/opt/fleshlab/releases/fleshlab-portal-separation-88c9399`
- Previous release: `/opt/fleshlab/releases/fleshlab-edge-8188165`
- Database backup created before deployment: `/opt/fleshlab/backups/portal-separation-pre-20260924181146.sql.gz`
- Database migration: none; this change uses the existing schema.

## DNS changes

Only these Cloudflare-proxied A records are added or updated:

- `admin.fleshlab.online` -> `20.102.36.202`
- `performer.fleshlab.online` -> `20.102.36.202`

The apex record, `earn.fleshlab.online`, and all other existing records remain unchanged.

## Application rollback

1. Stop the new compose project without touching PostgreSQL data.
2. Restore `/opt/fleshlab/releases/fleshlab-edge-8188165` as the compose release.
3. Restore the previous Caddy configuration and validate it before reload.
4. Recreate/reload the edge, web, API, and worker containers from that release.
5. Verify the public root and `earn.fleshlab.online` health.
6. Remove the `admin` and `performer` DNS records if the new hosts must be withdrawn.

No database restore is required because no migration was run. The backup above is retained for recovery if an unexpected data issue is observed.

## DNS rollback

Delete only the `admin.fleshlab.online` and `performer.fleshlab.online` records created for this release. Restore the prior apex and `earn.fleshlab.online` values only if independently changed; this deployment does not change them.

## Verification after rollback

- `https://fleshlab.online/` remains the existing public/V2 entry point.
- `https://earn.fleshlab.online/healthz` returns `200`.
- No V2 or Columbus host is changed by this rollback.
