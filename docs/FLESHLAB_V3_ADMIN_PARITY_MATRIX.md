# FLESHLAB V3 Admin-Paritätsmatrix

Stand: 2026-09-26  
Scope: FLESHLAB V3 Admin, V2 nur als Referenz.  
Production-Ziel: `FLESHLAB-PROD / fleshlab-prod-vm`.

## Bewertungsregeln

`VOLLSTÄNDIG ERSETZT` bedeutet, dass Eric den Ablauf über die V3-Oberfläche mit echten Daten abschließen kann. Ein vorhandener Endpoint oder eine reine Liste zählt nicht. `TEILWEISE ERSETZT` bedeutet, dass Daten oder einzelne Aktionen vorhanden sind, aber noch eine Bedienlücke, ein Provider oder ein nicht überprüfter Datenabgleich offen ist. `NICHT UMGESETZT` bedeutet, dass kein verlässlicher V3-Ausführungspfad vorhanden ist. `NOCH NICHT GEPRÜFT` wird nur verwendet, wenn der konkrete Ablauf technisch noch nicht geprüft werden konnte.

## Paket 1 und 2 – verifizierte Matrix

| Arbeitsablauf | V2 Referenz | V3 Einstieg / API | Datenmodell | Berechtigung | Status | Lücke / Umsetzung | Nachweis |
|---|---|---|---|---|---|---|---|
| HQ-Übersicht | `src/pages/admin/Dashboard.jsx` | HQ → `/api/v3/admin/*/overview` | V3 Catalogue, Creator, Production, Growth, Commerce, Contracts, System | `staff`/`admin`, je Projection | TEILWEISE ERSETZT | Live-Kennzahlen und Action Queue sind verbunden; historische V2-Kennzahlen und externe Analytics bleiben getrennt | `AdminOverview`, API-Smoke offen für finalen Production-Lauf |
| Creator / Bewerbungen | `Applications.jsx`, `RecruitmentIntelligence.jsx` | Creator / Recruitment → `/api/v3/admin/creators/*` | `performer_applications`, `v3_creator_records`, Links | `staff` lesen, `admin` mutieren | TEILWEISE ERSETZT | Review, Konvertierung und Links vorhanden; Betreuungs-/Kontaktvorlagen/Wiedervorlagen noch offen | bestehende `CreatorOperations`, authentifizierter Test erforderlich |
| Library / Videos | `Videos.jsx`, `VideoEdit.jsx` | Library → `/api/v3/admin/catalogue/videos`, Video-Detail | `catalog_videos`, `catalog_video_performers`, `v3_catalogue_video_meta`, `v3_media_*` | `staff` lesen, `admin` mutieren | TEILWEISE ERSETZT | Metadaten, Lifecycle, Publish-Readiness und Medienzuweisung vorhanden; Performer/Asset-Auswahl jetzt als Selector statt Freitext-ID; vollständige Medien-/SEO-Abnahme noch offen | `selectors` API, Catalogue UI, Tests 7/7 |
| Performer Operations | `Performers.jsx`, `PerformerDetailWrapper.jsx`, `PerformerEdit.jsx` | Performers → `/api/v3/admin/performers/*` | `catalog_performers`, Creator/User-Link, Label-Link, Audit | permission-basierte V3-Rechte | TEILWEISE ERSETZT | Operations-Workspace mit Detailbereichen vorhanden; einzelne Compliance-/Earnings-/Dokumentpfade müssen in Production mit Daten geprüft werden | bestehende PerformerOperations, separate Abnahme erforderlich |
| Data Export | `DataExport.jsx` | Data Export → `/api/v1/admin/exports/{all,Brand,Performer,Video,VideoPerformer}` | `catalog_*`, Video-Performer-Beziehung | `admin` | VOLLSTÄNDIG ERSETZT | Kontrollierte JSON-Downloads, keine privaten Uploads/Secrets; ZIP ist nicht Teil des vorhandenen sicheren V3-Pfades und bleibt offen | `DataExportWorkspace`, `server/data-export.test.js` |
| Collections / Serien | `ContentOrganization.jsx`, Collections-Navigation | Collections → `/api/v3/admin/catalogue/collections*` | `v3_catalogue_collections`, `v3_catalogue_collection_videos` | `staff` lesen, `admin` schreiben | TEILWEISE ERSETZT | Titel, Slug, Beschreibung, Sichtbarkeit, Reihenfolge und Videoauswahl nach Namen umgesetzt; Episodennummern/Fehlzuweisungsfilter noch offen | `CollectionOperations`, serverseitige Relation-Checks |
| News | `News.jsx` | News → `/api/v3/admin/growth/news*` | `news_articles`, optional Growth Campaign | V3 `growth.read/write` | TEILWEISE ERSETZT | Edit/Create, Kategorie, Tags, Cover-URL, SEO, Preview, Draft/Review/Publish; Upload-Endpoint für Cover in V3 nicht vorhanden und daher explizit als Lücke angezeigt | `AdminNewsWorkspace`, Backend `saveNews` |
| Homepage-Editor | V2 Dashboard/Content-Organisation | Catalogue → Homepage Curation → `/api/v3/admin/catalogue/homepage` | Homepage-Konfiguration + öffentliche Projektionen | `catalogue.publish` | TEILWEISE ERSETZT | Hero, Featured-Auswahl, Sichtbarkeit, Preview und Audit vorhanden; Editor bleibt kompakt und benötigt einen Browser-Akzeptanzlauf mit Wirkungskontrolle | `HomepageCuration` |
| Discovery | `Discovery.jsx` | Discovery → `/api/v1/admin/discovery` | Applications, Catalogue | `staff`/`admin` | VOLLSTÄNDIG ERSETZT | Self-hosted Signale und Queue sichtbar; GA4/GSC bewusst `not_migrated`, keine Nullwerte erfunden | `AdminSnapshotWorkspace` |
| Marketing | `Marketing.jsx` | Marketing → `/api/v1/admin/marketing` | Recruitment campaigns, News, Catalogue | `staff`/`admin` | VOLLSTÄNDIG ERSETZT | Campaign-/Content-Snapshot und Integrationsstatus; externe Posting-/Analytics-Provider nicht konfiguriert | `AdminSnapshotWorkspace` |
| Campaigns | `Campaigns.jsx`, Recruitment Campaign Center | Growth/Campaigns → `/api/v3/admin/growth/campaigns*` | `v3_growth_campaigns`, Attribution/Events | V3 Growth-Rechte | TEILWEISE ERSETZT | Campaign CRUD, Status, Attribution/UTM und Distribution vorhanden; vollständige Herkunftszuordnung und Browser-Abnahme offen | `GrowthWorkspace initialTab=Campaigns` |
| Business / Commerce | `RevenueDashboard.jsx`, `Payments.jsx`, `PayoutRequests.jsx` | Business/Commerce → `/api/v3/admin/commerce/*` | V3 Commerce ledger/payout foundation | staff read, admin mutations; execution gated | TEILWEISE ERSETZT | Datenmodell und read-only/readiness UI vorhanden; Provider, historische Finanzmigration und Geldbewegungen bewusst nicht aktiviert | `Commerce`, provider readiness state |
| Rendering Intelligence | `RenderingIntelligence.jsx` | Rendering Intelligence → `/api/v1/admin/operations/rendering` | `admin_rendering_jobs` | `admin` | TEILWEISE ERSETZT | V3 zeigt und speichert Records; normale Provider-/Asset-Auswahl und echte Execution-Konfiguration fehlen/bleiben fail-closed | `AdminOperationsWorkspace`, `RENDERING_EXECUTION_NOT_CONFIGURED` prüfen |
| Production QA | `ProductionQA.jsx` | Production QA → `/api/v1/admin/operations/qa`, zusätzlich V3 Production QA | `admin_qa_records`, V3 production records | `admin` | TEILWEISE ERSETZT | Records/Notizen sichtbar; vollständige prüfbare Kriterien, Ergebnisbericht und Browserworkflow offen | Operations API vorhanden |
| Studio Audit | `StudioAudit.jsx` | Studio Audit → `/api/v1/admin/operations/audit` | `admin_studio_audits` | `admin` | TEILWEISE ERSETZT | Audit records sichtbar; V2 Score-/Run-Logik nicht als V3-Ausführung bewiesen | Operations API vorhanden |
| Certification | `Certification.jsx` | Certification → `/api/v1/admin/operations/certification` | `admin_certifications` | `admin` | TEILWEISE ERSETZT | Records sichtbar; V2 `base44.functions.invoke`-Run ist nicht als V3 übernommen, daher keine vorgetäuschte Ausführung | bewusst als Lücke markiert |
| Adult Provider Readiness | `AdultImageProviderReadiness.jsx` | Adult Provider Readiness → `/api/v1/admin/operations/readiness` | `admin_provider_readiness` | `admin` | TEILWEISE ERSETZT | Readiness records; Provider-Discovery/Execution nicht konfiguriert | Operations API vorhanden |
| Automation | V2 Admin Automation | Automation → `/api/v1/admin/operations/automation` | `admin_automations` | `admin` | TEILWEISE ERSETZT | Definitionen und Status sichtbar; keine externen Automationen aktiviert | fail-closed |
| Settings | V2 Settings | Settings → V3 System Settings | `v3_system_settings`, System APIs | `system.settings` | VOLLSTÄNDIG ERSETZT | V3 Settings tab ist erreichbar; Server prüft Berechtigung | Endpoint-Guard-Test |

## Nicht umgesetzte bzw. blockierte V2-Kreativpfade

| V2 Fähigkeit | V2 Referenz | V3 Status | Begründung |
|---|---|---|---|
| KI-Titel-/Beschreibungserstellung | `AITextGenerator.jsx` | NICHT UMGESETZT | Kein verifizierter V3 Provider-/Worker-Ausführungspfad; keine Ergebnisse werden simuliert. |
| Cover Designer / Medienanalyse | `AIMediaStudio.jsx`, `VisualAttentionMapLab.jsx` | NICHT UMGESETZT | V2 hängt an Provider-/Base44-nahen Pfaden; V3 Media Foundation hat derzeit keinen sicheren Analyse-/Generierungsauftrag mit Ergebnisversionierung. |
| Hybrid Creative Brain | `CreativeBrain.jsx` | NICHT UMGESETZT | Kein angeschlossener V3 Provider/Worker mit Kosten-, Status- und Auditkontrolle. Promo Assets sind ausdrücklich kein Ersatz. |

## Reparierte technische Fehler

### Contracts

Die aktuelle V3-Source und das aktuelle Production-Bundle enthalten keinen Verweis auf `adminr.fleshlab.online`; der vermeintliche Host ist nicht auflösbar. Der V3 Contracts-Einstieg verwendet same-origin `/api/v3/admin/contracts/*`. Der Fehler ist daher als historische/falsch erzeugte Zieladresse dokumentiert, nicht durch einen DNS-Eintrag kaschiert. Der aktuelle Contract Center bietet Templates, Versionen, Creator-Auswahl, Preview, PDF und Draft-Erstellung; Signatur bleibt bewusst deaktiviert.

### Roles & Permissions

Der System-Tab hatte zuvor eine Inline-Abbildung, die bei unbekanntem Tab zu `undefined` führen konnte. Die Abbildung liegt jetzt in `v3/admin-endpoints.js`; unbekannte Tabs werfen `SYSTEM_TAB_NOT_CONFIGURED`, bevor ein Request gebaut wird. Die Route `/api/v3/admin/system/roles` bleibt serverseitig geschützt.

## Offene Datenabgleiche / Integrationen

- V2-Artikelbestand gegen `news_articles` anhand IDs/Slugs abgleichen; eine leere Liste ist kein Migrationsnachweis.
- V2-Kategorien/Serien/Episodennummern gegen V3 Collections prüfen; keine automatische Zusammenlegung.
- Kampagnen/Attribution historisch gegen `v3_growth_*` und `recruitment_campaigns` abgleichen.
- Finanzhistorie nur als Vorschau abgleichen; keine Buchungen, Refunds oder Auszahlungen ausführen.
- `NOT_RESTORE_TESTED` und fehlende Backup-Location bleiben Betriebsnachweise, bis eine isolierte Restore-Prüfung dokumentiert ist.
- Testdaten im Catalogue identifizieren und bei Bedarf als Test markieren; nicht blind löschen.

## Test- und Abnahmestatus

Aktuell lokal ausgeführt:

- `node --test server/admin-endpoints.test.js server/v3-catalogue.test.js`: 7 Tests bestanden.
- `npx eslint v3/src/main.jsx v3/src/admin-hq.jsx v3/admin-endpoints.js --quiet`: bestanden.
- `npm run build:admin`: bestanden.

Noch erforderlich vor einer Paritätsaussage:

- vollständige serverseitige Tests und Buildmatrix
- authentifizierte Browserprüfung jedes neuen HQ-Einstiegs
- eingeschränkte Staff-Rollenprüfung
- Production-Backup, Deployment und Production-Smoke
- Datenabgleich mit konkreten IDs/Beziehungen

Diese Matrix ist deshalb kein Abschlussbericht „Admin-Parität erreicht“, sondern der fortgeschriebene Arbeitsnachweis.
