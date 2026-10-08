# FLESHLAB V3 / Chain2Pay Payment Runbook

## Zweck

FLESHLAB V3 verwendet Chain2Pay als serverseitigen Zahlungsprovider für
Einzelkäufe, zeitlich begrenzte Abonnements und vorbereitete Wallet-/Credit-
Aufladungen. Chain2Pay verarbeitet die Kundenzahlung; die interne Abrechnung
verifiziert danach den Providerstatus und schreibt eine idempotente
FLESHLAB-Entitlement-/Ledger-Buchung.

Normale Kunden sehen keine Polygon- oder USDC-Mechanik. Die öffentliche
Checkout-Oberfläche beschreibt Card-, Wallet- und Bankoptionen nur als
provider-/regionsabhängig. PayPal und Stripe sind standardmäßig blockiert.

## Runtime-Secrets

Diese Variablen gehören ausschließlich in die geschützte API-Produktions-
konfiguration, niemals in React, `dist-v3`, Logs oder Git:

```text
CHAIN2PAY_ENV=live
CHAIN2PAY_API_KEY=c2p_live_...
CHAIN2PAY_WEBHOOK_SECRET=...
CHAIN2PAY_PROVIDER_MODE=AUTO
CHAIN2PAY_BLOCKED_PROVIDERS=paypal,stripe
CHAIN2PAY_CALLBACK_URL=https://fleshlab.online/api/v3/payments/chain2pay/webhook
```

Für die Sandbox wird ein separates `c2p_sandbox_...`-Secret benötigt:

```text
CHAIN2PAY_ENV=sandbox
CHAIN2PAY_SANDBOX_API_KEY=c2p_sandbox_...
CHAIN2PAY_WEBHOOK_SECRET=...
```

Der aktuelle Code verweigert Provideraufrufe, wenn Environment und
Key-Präfix nicht zusammenpassen. Der aktuelle Production-API-Container hatte
bei der Implementierung keine `CHAIN2PAY_*`-Variablen; daher bleibt der Weg
bis zur geschützten Konfiguration sicher deaktiviert.

## Datenmodell

Migration `0036_chain2pay_payment_flow.sql` erweitert die vorhandenen
Commerce-Orders um Providerreferenzen und erstellt:

- `v3_commerce_plan_offers`: explizite Plan-zu-PPV-/Abo-/Wallet-Zuordnung
- `v3_commerce_content_entitlements`: idempotente Video-Freischaltung
- zusätzliche Chain2Pay-/Settlement-Felder an Orders und Payments

Preise kommen aus `v3_commerce_plans.amount_minor`. Das Frontend darf weder
Preis noch Produktquelle bestimmen. Ein PPV-Offer darf nur auf ein bereits
öffentlich veröffentlichtes Video zeigen. Ein Abo-Offer kann katalogweit oder
auf ein konkretes Video begrenzt werden.

## Endpunkte

Öffentlich/authentifiziert:

- `GET /api/v3/public/commerce/offers?product_id=...`
- `POST /api/v3/payments/checkout`
- `GET /api/v3/payments/:order_id/status`
- `GET /api/v3/payments/chain2pay/webhook`

Admin:

- `GET /api/v3/admin/commerce/chain2pay`
- `POST /api/v3/admin/commerce/chain2pay/offers`
- `DELETE /api/v3/admin/commerce/chain2pay/offers/:id`
- `POST /api/v3/admin/commerce/chain2pay/orders/:id/sandbox-confirm`

Der Webhook ist nur ein Hinweis. Nach gültiger HMAC-SHA256-Prüfung wird der
Chain2Pay-Status serverseitig erneut über `GET /api/v2/payments/:id` gelesen.
Erst ein passender `paid`-Status mit passender USD-Summe und Währung darf
erfüllen. Wiederholte Webhooks bleiben durch Provider-/Order-/Ledger-
Idempotenz ohne Doppel-Freischaltung.

## Sandbox-Abnahme

1. Sandbox-Key und Webhook-Secret geschützt im API-Runtime-Environment setzen.
2. `CHAIN2PAY_ENV=sandbox` setzen.
3. Im Admin einen aktiven Plan und ein Offer anlegen.
4. Mit einem Testkunden den Checkout öffnen.
5. Den Sandbox-Zahlungsweg abschließen bzw. den geschützten Admin-
   Sandbox-Confirm-Endpunkt verwenden.
6. Signierten Webhook mit derselben Callback-URL testen.
7. Prüfen: Order `paid`, Payment `succeeded`, genau ein Entitlement bzw.
   genau ein Ledger-Eintrag.
8. Wiederholung desselben Webhooks ausführen und auf unveränderte Anzahl
   prüfen.
9. Erst danach Live-Key einsetzen und die vorhandene
   `v3_commerce_execution`-Freigabe nach separater Prüfung aktivieren.

Keine echten Live-Zahlungen als Smoke-Test auslösen. Ohne erfolgreiche
Sandbox-Abnahme und ohne Provider-/Webhook-Konfiguration darf die
Commerce-Ausführung nicht aktiviert werden.

## Rollback

Vor Migration und Deployment eine PostgreSQL-Sicherung und den vorherigen
Release aufbewahren. Bei einem reinen Code-Rollback bleibt die additive
Migration bestehen; die neuen Routes bleiben ohne gültige Secrets
fail-closed. Eine Datenbankmigration wird nicht rückwärtsgerichtet oder durch
Löschen von Orders/Entitlements zurückgerollt.
