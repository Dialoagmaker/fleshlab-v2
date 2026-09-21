# FLESHLAB V3 — foundation architecture

V3 is deployed beside V2 under `/v3/`. It has an independent Vite build and asset namespace, while V2 remains the live fallback under `/`.

## Phase 1 domains

- **Core:** existing self-hosted session auth and role enforcement, with V3-only UI.
- **Catalogue:** read-only V3 projection of PostgreSQL `catalog_*` tables. Legacy IDs remain migration references; the two invalid raw VideoPerformer relations remain excluded.
- **Operations:** real `dashboard/admin` metrics and API health. No synthetic KPIs.

## V3 domain plan

| Domain | V2 source | V3 direction |
| --- | --- | --- |
| Core | auth, user profiles | retain session contracts; consolidate roles and audit events |
| Catalogue | brands, performers, videos, collections | clean read/write domain with explicit publishing lifecycle |
| Creator | recruitment, performer profiles, contracts | creator-focused workspace, not Admin pages |
| Media | uploads, assets, processing | private/public asset records and persistent jobs |
| Editorial & Growth | news, discovery, campaigns, marketing | retain PostgreSQL-backed sources behind V3 APIs |
| Production | QA, audit, certification | one asset-to-publishing review workflow |
| Creative Studio | cover optimizer, creative brain, rendering | merge local tools; provider execution stays disabled until configured |
| Commerce | Base44 finance sources | schema first; provider execution and historic import require separate approval |
| Automation | V2 workflows | persistent job-backed execution only |

## Explicit exclusions from Phase 1

No Base44 runtime calls, finance activation, AI provider activation, V2 data deletion, or V2 route replacement.
