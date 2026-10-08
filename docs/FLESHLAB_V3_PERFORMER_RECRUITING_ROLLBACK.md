# FLESHLAB V3 Performer Operations + Recruiting Rollback

## Scope

This release adds the admin performer workspace completion, the public performer application route, the additive recruiting notification queue, and the homepage performer recruitment call.

It does not change root V2 routing, DNS, Cloudflare, Earn, Admin/Performer host separation, or the public database projections.

## Production release

- Release: `/opt/fleshlab/releases/fleshlab-performer-operations-20260926064000`
- Previous application release: `/opt/fleshlab/releases/fleshlab-performer-os-20260926051832`
- Database migration: `0035_v3_performer_recruiting_notifications.sql` (additive)

## Application rollback

1. Verify the target is `FLESHLAB-PROD / fleshlab-prod-vm`.
2. Do not delete the new notification table or application records during a normal application rollback.
3. From the previous release, rebuild and recreate only the API, worker and web services:

```sh
cd /opt/fleshlab/releases/fleshlab-performer-os-20260926051832
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml build api worker web
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml up -d --no-build --no-deps api worker web
```

4. Verify `/healthz`, the public V3 homepage/API, the performer operations API, Admin login, Performer login boundary, Earn health/auth, and the unchanged V2 root.

## Data rollback

The migration is additive. A code rollback does not require restoring PostgreSQL and must not remove applications, notification evidence, performer links, contracts, or audit records. A database restore requires a separate approved recovery decision and an isolated validation first.

## WhatsApp configuration

The application stores a durable `not_configured` notification record when no approved provider adapter is configured. It never claims provider acceptance or delivery. Do not replace this with a `wa.me` link: that link is only the applicant-initiated contact path.
