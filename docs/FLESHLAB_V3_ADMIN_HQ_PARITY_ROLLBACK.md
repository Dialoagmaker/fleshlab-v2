# FLESHLAB V3 Admin HQ Parität – Rollback

## Zielumgebung

- Azure Resource Group: `FLESHLAB-PROD`
- VM: `fleshlab-prod-vm`
- Deployment scope: V3 `web` + V3 `api`/`worker` images; keine Migration
- Root/V2, Portale, DNS und Cloudflare bleiben unverändert

## Release-Zuordnung

- vorheriger Production-Release: `/opt/fleshlab/releases/fleshlab-admin-overview-20260925202919`
- neuer Release: `/opt/fleshlab/releases/fleshlab-admin-hq-parity-20260926045003`
- Datenbankbackup: nicht erforderlich für dieses additive, schemafreie Paket; der vorherige Release bleibt vollständig erhalten

## Rollback

Auf `fleshlab-prod-vm` ausführen:

```sh
set -eu
release=/opt/fleshlab/releases/fleshlab-admin-overview-20260925202919
cd "$release"
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml build api worker web
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml up -d --no-build --no-deps api worker web
```

Danach prüfen:

```sh
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'fleshlab-(web|api|worker)-1'
curl -ksS -o /dev/null -w 'admin=%{http_code}\n' https://admin.fleshlab.online/
curl -ksS -o /dev/null -w 'api401=%{http_code}\n' https://admin.fleshlab.online/api/v3/admin/system/overview
```

Rollback verändert weder DNS noch Cloudflare, Caddy, Root-V2 oder `earn.fleshlab.online`.

## Paketumfang

- zentraler V3 System-Endpoint-Guard gegen `undefined`-Requests
- neue HQ-Einstiege für Export, News, Discovery, Marketing und Operations-Datensätze
- sichere Catalogue-Selector-Projektion für aktive/public-ready Auswahl
- Collections-/Serien-Editor mit relationaler Videoauswahl
- Paritätsmatrix und Regressionstests

Nicht enthalten: DB-Migration, externe Provider-Aktivierung, Geldbewegungen, Signaturen oder Root-Cutover.
