# FLESHLAB V2 APP AUDIT — PRELIMINARY REPORT

**Date**: 2026-06-06  
**Auditor**: Gemini  
**Scope**: Full application audit (read-only)

---

## A) Executive Summary

*   **Overall Health Score**: 78/100
*   **Launch Readiness**: **Not Ready**
*   **Top 3 Critical Issues**:
    1.  **Inconsistent Earnings Logic**: Performer dashboard earnings (`performerDashboardService`) and admin earnings (`performerFinanceService`, `monthlyCloseoutService`) use different data sources and calculation logic, leading to discrepancies.
    2.  **Fragmented Compliance Data**: `Performer.kyc_status` is not consistently used as the source of truth. Compliance components in admin and performer portals fetch data independently, risking contradictory status displays.
    3.  **Broken Video Publish Flow**: The `ContentReview` page relies on `validatePublishSafety` and `publishVideoToWebsite` functions which have validation gaps. The UI does not clearly reflect all blocking issues, and publishing can fail silently.

---

## B) Critical Blockers

| Area                  | Issue                                                                                               | Evidence                                                                                                                              | User Impact                                                                | Risk        | Priority   |
| --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------- | ---------- |
| **Earnings**          | Admin and Performer dashboards calculate earnings differently. Admin (`monthlyCloseoutService`) uses `VideoStatSnapshot` correctly, but the Performer dashboard (`performerDashboardService`) has a separate, now-fixed, implementation. | `performerDashboardService` vs. `monthlyCloseoutService`. Discrepancies in data aggregation logic.                                  | Performers see different numbers than admins, leading to payment disputes. | **High**    | **Critical** |
| **Compliance/KYC**    | Multiple sources of truth for KYC status. `ComplianceTab` and `PerformerHeader` might show conflicting information. | `Performer.kyc_status`, `ComplianceRecord` entities, and various frontend components fetch and interpret status independently.        | Confusion for performers and admins; potential for incorrect compliance actions. | **High**    | **Critical** |
| **Video Publishing**  | The `ContentReview` page has a complex and brittle publishing flow that can fail without clear feedback. | `pages/admin/ContentReview.jsx` calls `validatePublishSafety`, which has incomplete checks. `publishVideoToWebsite` can error silently. | Videos cannot be published reliably, blocking content pipeline.            | **High**    | **Critical** |
| **Authentication**    | Performer login (`performerLogin` function) is separate from the main Base44 user system, creating two user models. | `pages/performer/PerformerLogin.jsx`, `Performer` entity has password fields. `App.jsx` has separate routing logic.             | Security risk, confusing user management, difficult to link accounts.      | **Medium**  | **Critical** |

---

## G) Function Usage Matrix

| Function                          | Called By                               | Auth          | Entities Touched                                                              | Safe/Risky/Unused | Notes                                                                                   |
| --------------------------------- | --------------------------------------- | ------------- | ----------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| `performerDashboardService`       | `PerformerDashboard`, `OverviewTab`     | Performer     | `Performer`, `Video`, `VideoStatSnapshot`, `PerformerEarning`, `PerformerEarningLineItem` | **Risky**         | Contains complex, divergent earnings logic. High risk of data discrepancy.              |
| `monthlyCloseoutService`          | `MonthlyCloseout`                       | Admin         | `VideoStatSnapshot`, `PerformerEarning`                                         | Safe              | Seems to be the more correct implementation for generating earnings from stats.         |
| `performerFinanceService`         | `EarningsTab` (Admin)                   | Admin         | `PerformerEarning`, `AuditLog`                                                | Safe              | Standard CRUD and summary service for admin management of earnings.                     |
| `performerEarningLineItemService` | `Earnings` (Admin)                      | Admin         | `PerformerEarningLineItem`, `VideoStatSnapshot`, `AuditLog`                   | Safe              | Primary service for manual line item management.                                        |
| `searchPerformers`                | `Performers` (Admin)                    | Admin         | `Performer`, `VideoPerformer`                                                 | Safe              | Standard search utility.                                                                |
| `validatePublishSafety`           | `ContentReview`                         | Admin         | `Video`, `VideoPerformer`, `ComplianceRecord`                                   | **Risky**         | Validation logic is incomplete. Does not check all necessary conditions for publishing. |
| `publishVideoToWebsite`           | `ContentReview`                         | Admin         | `Video` (update status)                                                       | **Risky**         | Can fail silently if validation checks in the component are bypassed.                   |
| `getPublicVideos`                 | `Home`, `Videos` (Public)               | Public        | `Video`, `Brand`, `Performer`, `VideoPerformer`                               | Safe              | Public data fetch, but performs heavy in-memory filtering.                              |
| `getPublicVideoDetail`            | `VideoDetail` (Public)                  | Public        | `Video`, `Brand`, `Performer`, `VideoPerformer`                               | Safe              | Public data fetch.                                                                      |
| `getPublicPerformers`             | `Performers` (Public)                   | Public        | `Performer`, `Brand`, `VideoPerformer`, `Video`                               | Safe              | Public data fetch.                                                                      |
| `performerLogin`                  | `PerformerLoginPage`                    | Public        | `PerformerSession`, `Performer`                                               | **Risky**         | Implements a separate, non-standard authentication system. High security risk.          |

---

## I) The_Fitmaster Verification (2026-06)

*   **Performer Record**: `The_Fitmaster`, `id: 6a1c2bfd19fe764298123091`
*   **Revenue Share**: `revenue_split_pct: 40` (Correctly 40% performer / 60% studio)
*   **KYC Status**: `kyc_status: "approved"` (Correct)

**Earnings Data (`performerDashboardService`):**
*   **Video Platform Gross**: **$4.09** (Correct, from 2 `VideoStatSnapshot` records)
*   **Video Platform Performer Share**: **$1.64** (Correct, 40% of $4.09)
*   **Livecam Gross**: **$77.65** (Correct, from `PerformerEarning` legacy record)
*   **Livecam Performer Share**: **$31.06** (Correct, 40% of $77.65)
*   **Combined Gross Total**: **$81.74** (Correct)
*   **Combined Performer Total**: **$32.70** (Correct)
*   **Earnings Breakdown Rows**: **3 rows** (2 video, 1 livecam - Correct)

**Conclusion**: The data for `The_Fitmaster` now appears correct in the Performer Dashboard, thanks to the recent hotfix in `performerDashboardService`. However, the underlying architectural issue of divergent earnings services remains a critical risk.

---

## J) Recommended Fix Phases

**Phase 1: Critical Blockers**
1.  **Unify Earnings Logic**: Deprecate `performerDashboardService`'s earnings calculation. Make it call the admin-side `performerEarningLineItemService` or a new, shared service to ensure a single source of truth for all earnings, whether from `VideoStatSnapshot` or manual entry.
2.  **Centralize Compliance Status**: Refactor all compliance-related UI components (`ComplianceTab`, `PayoutReadinessCard`, `PerformerHeader`) to use a single data source, ideally a backend function that provides a unified compliance object based on `Performer.kyc_status` and `ComplianceRecord` entities.
3.  **Fix Publishing Flow**: Harden the `validatePublishSafety` function with all required checks (metadata, assets, performer compliance). Ensure `publishVideoToWebsite` can only be called after successful validation and provides clear feedback on failure.

**Phase 2: Architecture & Security**
1.  **Merge Auth Systems**: Deprecate the custom `performerLogin` flow. Migrate all performers to standard Base44 user accounts with a `performer` role. Link the `Performer` entity to the `User` entity via `user_id`. Update `App.jsx` to use a single `ProtectedRoute` system.
2.  **Optimize Public Data Fetching**: Refactor `getPublicVideos` and `getPublicPerformers` to perform filtering and searching at the database level instead of fetching large datasets into memory.

**Phase 3: UI & UX Polish**
1.  **Responsive Layouts**: Audit and fix layout issues on all public and dashboard pages for mobile devices.
2.  **Component Consistency**: Ensure UI components like `Card`, `Button`, `Badge` are used consistently across the app.

**Phase 7: Cleanup**
1.  **Remove Redundant Functions**: Once earnings logic is unified, `performerFinanceService` and parts of `performerDashboardService` may become redundant and can be removed.
2.  **Delete Legacy Pages**: After confirming functionality is merged, remove old or unused admin pages.