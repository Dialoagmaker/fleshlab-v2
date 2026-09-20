#!/usr/bin/env bash
set -euo pipefail

# Invoked through Azure Run Command. Parameters are deliberately non-secret:
# public host and immutable source artifact name.
PUBLIC_HOST="${1:?public host required}"
ARTIFACT_NAME="${2:?artifact name required}"
STORAGE_ACCOUNT='fleshlabprod233ab'
KEY_VAULT='fleshlabprod233abkv'
RELEASE_DIR="/opt/fleshlab/releases/${ARTIFACT_NAME%.tar.gz}"
SECRETS_DIR='/run/fleshlab-secrets'

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl docker.io docker-compose-v2 jq tar
systemctl enable --now docker

token_for() {
  local resource="$1"
  curl -fsS -H Metadata:true "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2019-08-01&resource=${resource}" | jq -r '.access_token'
}

vault_secret() {
  local name="$1"
  local token
  token="$(token_for 'https%3A%2F%2Fvault.azure.net')"
  curl -fsS -H "Authorization: Bearer ${token}" "https://${KEY_VAULT}.vault.azure.net/secrets/${name}?api-version=7.4" | jq -r '.value'
}

install -d -m 0700 "$SECRETS_DIR"
umask 077
vault_secret fleshlab-postgres-password > "$SECRETS_DIR/postgres_password"
vault_secret fleshlab-session-secret > "$SECRETS_DIR/session_secret"

storage_token="$(token_for 'https%3A%2F%2Fstorage.azure.com%2F')"
tmp_archive="$(mktemp)"
trap 'rm -f "$tmp_archive"' EXIT
curl -fsS \
  -H "Authorization: Bearer ${storage_token}" \
  -H "x-ms-version: 2023-11-03" \
  -H "x-ms-date: $(date -u '+%a, %d %b %Y %H:%M:%S GMT')" \
  "https://${STORAGE_ACCOUNT}.blob.core.windows.net/deployment-artifacts/${ARTIFACT_NAME}" \
  -o "$tmp_archive"

install -d -m 0755 "$RELEASE_DIR"
tar -xzf "$tmp_archive" -C "$RELEASE_DIR"

export PUBLIC_HOST
export PUBLIC_ORIGIN="https://${PUBLIC_HOST}"
export AZURE_STORAGE_ACCOUNT_URL="https://${STORAGE_ACCOUNT}.blob.core.windows.net"
export POSTGRES_PASSWORD_FILE="${SECRETS_DIR}/postgres_password"
export SESSION_SECRET_FILE="${SECRETS_DIR}/session_secret"
export COMPOSE_PROJECT_NAME='fleshlab'
cd "$RELEASE_DIR"
# Never run a migration against a cached image from an earlier release. Build
# every local service before the no-build start so the worker has its image too.
docker compose build api worker web
docker compose run --rm api node server/migrate.js
# Local image tags are intentionally stable on the small VM. Recreate service
# containers after a successful immutable source build so a rebuilt `latest`
# image cannot leave an older API process serving stale routes.
docker compose up -d --no-build --remove-orphans --force-recreate
docker compose ps
