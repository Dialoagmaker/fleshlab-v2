# SEO Infrastructure Release Deployment

This release completes the generic SEO infrastructure and adds a dynamic API
sitemap. It requires no database migration. Build and deploy from a clean
checkout of the final release commit; do not build from a dirty development
worktree.

Required application components are the API image (sitemap endpoint), Web/Nginx
image (initial-response SEO policy), and Edge/Caddy configuration. Worker and
PostgreSQL do not require changes.

## Production topology to preserve

- `fleshlab.online/` is rewritten by Caddy to `/v3/` and served by the V3 shell.
- `/v3/*` and `/api/v3/*` continue to use the existing origin alias
  `fleshlab-test-233ab.eastus.cloudapp.azure.com`.
- That alias resolves to the production VM (`20.102.36.202`); it is not a
  separate test environment. Do not replace this origin because its hostname
  contains `test`.
- `performer.fleshlab.online` remains isolated in its dedicated Nginx server
  block and Performer document root. The default web server continues to serve
  the normal/V3 application paths.
- Existing admin, Performer, and Earn host routing, TLS certificate paths, and
  Caddy security headers remain in `infra/Caddyfile`.

## Build and cutover

1. Keep the currently serving release and image tags available for rollback.
2. Build the Web image from the clean release checkout. The SEO Nginx policy is
   generated during the build from the repository's existing route policy.
3. Validate the candidate Caddyfile using the production Compose environment
   and the mounted certificate directory before cutover. Do not edit the
   historical release directory currently mounted by the running edge container.
4. Point `/opt/fleshlab/current` at the candidate release and load the required
   candidate images using the established release procedure.
5. Recreate the Web and Edge services as required by the release. The Edge
   container bind-mounts `./infra/Caddyfile`; changing `current` does not update
   a mount held by the existing container. Recreate Edge from the new release
   directory so the bind mount resolves to the candidate Caddyfile:

   ```sh
   cd /opt/fleshlab/current
   docker compose --env-file .env up -d --no-deps --force-recreate web edge
   ```

   Do not restart PostgreSQL. API and Worker are not required for this
   infrastructure-only SEO release.

## Validation and rollback

- Check Caddy configuration with the production environment and certificate
  mounts before recreating Edge.
- After cutover, verify `/`, `/v3/`, `/robots.txt`, the API sitemap endpoint,
  representative public and private routes, all portal health checks, and the
  Web/API/Worker/Edge health state.
- Confirm the API sitemap response is XML and its canonical URLs correspond to
  public indexable routes. Its database queries project only route slugs and
  available update/import timestamps, and apply the existing
  publication/visibility filters.
- If validation fails, point `current` to the previous release, restore the
  previous Web image, and recreate Web and Edge from that previous release.
  Leave database state unchanged; no migration is part of this release.
