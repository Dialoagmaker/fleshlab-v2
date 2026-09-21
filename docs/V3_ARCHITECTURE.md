# FLESHLAB V3 — foundation architecture

V3 is deployed beside V2 under `/v3/`. It has an independent Vite build and asset namespace, while V2 remains the live fallback under `/`.

## Implemented domains

- **Core:** existing self-hosted session auth and role enforcement, with V3-only UI.
- **Catalogue:** V3 projection and controlled metadata workflows over PostgreSQL `catalog_*` tables. Legacy IDs remain migration references; the two invalid raw VideoPerformer relations remain excluded.
- **Operations:** real `dashboard/admin` metrics and API health. No synthetic KPIs.
- **Creator:** canonical recruiting records remain authoritative. V3 adds an explicit creator record, opt-in performer linkage, onboarding items, document review metadata, contract projection, creator notifications and append-only audit events. Private object keys and application continuation capabilities never leave V3 APIs.
- **Commerce:** a schema-ready, read-only operational surface. It reports whether real records exist and whether providers are configured; it cannot create payments, refunds, ledger entries, subscriptions, earnings or payouts.

## Creator data boundaries

| Classification | V3 treatment |
| --- | --- |
| Public performer/catalogue metadata | Canonical `catalog_*` records, visible only through the catalogue domain. |
| Creator private | Application, document metadata, onboarding and contract state; restricted to the linked performer account and authorized staff. |
| Admin internal | Reviewer notes, review decisions and audit history; never returned from creator-scoped endpoints. |

An approved application may be converted once into a V3 creator record. The conversion is idempotent through the canonical `performer_profiles.application_id` uniqueness constraint. An administrator may link an existing catalogue performer or create a new **draft** performer after duplicate checks; neither flow creates a signed contract, a document, a payment or a creator account.

## Commerce safety boundary

The V3 Commerce migration creates constrained tables for customers, orders, subscriptions, payment intents, payments, provider events, wallets, immutable-style ledger entries, creator earnings and payout requests. It intentionally imports **no** financial rows and exposes no write endpoint. Provider status is a configuration readiness signal only. Before execution can be enabled, a provider account, signature verification, replay protection, idempotency, reconciliation and a reviewed financial migration are required.

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

## Explicit exclusions

No Base44 runtime calls, finance activation, AI provider activation, V2 data deletion, V2 route replacement, raw private-document delivery, electronic signature simulation, or automatic creator identity matching.
