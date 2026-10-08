# FLESHLAB V2 — COMPLETE ARCHITECTURE & AUDIT REPORT
**Date**: 2026-06-06 | **Status**: READ-ONLY AUDIT — NO CODE CHANGED

---

## SECTION 1 — FULL PAGE INVENTORY

| # | File Path | Route | Type | Purpose | Key Components | Functions Called | Entities Read/Written | Issues |
|---|-----------|-------|------|---------|----------------|------------------|-----------------------|--------|
| 1 | pages/Home | / | Public | Homepage: video grid, performer carousel, news, promo banner | TubeVideoCard, PerformerCarousel, FanclubBanner, StudioJournal | getPublicVideos, getPublicPerformers, getPublicNews | Video(r), Performer(r), NewsArticle(r) | Loads all 36 videos on home - no infinite scroll |
| 2 | pages/Videos | /videos | Public | Video library with filters and pagination | VideoCard, VideoFilters | getPublicVideos (direct fetch) | Video(r), Brand(r) | Uses sessionStorage cache, direct fetch (bypasses base44 SDK) |
| 3 | pages/VideoDetail | /videos/:slug | Public | Single video page, trailer/playback, CTAs | VideoRail, PerformerSection, CheckoutButton | getVideoPlaybackUrl | Video(r), Performer(r), VideoPerformer(r), Brand(r) | **BUG**: Fetches ALL published videos then filters client-side by slug — N+1 approach; also loads all VideoPerformer records (base44.entities.VideoPerformer.list()) |
| 4 | pages/Performers | /performers | Public | Performer roster grid | PerformerCard | getPublicPerformers | Performer(r), Brand(r) | Hardcodes Fitmaster+Jameson as "featured" |
| 5 | pages/PerformerDetail | /performers/:slug | Public | Performer profile page, bio, video grid | VideoCard, PerformerBadges, FanclubSupportBlock | None (entity SDK direct) | Performer(r), Video(r), VideoPerformer(r), Brand(r) | **BUG**: Calls base44.entities.Video.list() and base44.entities.Performer.list() — fetches ALL videos and performers, no status filter, no pagination |
| 6 | pages/Fanclub | /fanclub | Public | Fanclub sales page with pricing and payment CTAs | CheckoutButton, PerformerSupportCard | None (entity SDK direct) | Video(r), Performer(r) | Fetches all videos/performers for imagery |
| 7 | pages/GuestProduction | /guest-production | Public | Guest production application landing page | None | None | None | Static marketing page |
| 8 | pages/Login | /login | Public | Base44 user login | AuthLayout, GoogleIcon | base44.auth.loginViaEmailPassword | User(r) | Functional |
| 9 | pages/Register | /register | Public | Base44 user registration with OTP | AuthLayout, InputOTP | base44.auth.register, verifyOtp | User(w) | Functional |
| 10 | pages/ForgotPassword | /forgot-password | Public | Password reset request | AuthLayout | base44.auth.resetPasswordRequest | None | Functional |
| 11 | pages/ResetPassword | /reset-password | Public | Password reset completion | AuthLayout | base44.auth.resetPassword | None | Functional |
| 12 | pages/BecomePerformer | /become-performer | Public | Performer recruitment landing | None | None | None | Static marketing page |
| 13 | pages/HowItWorks | /how-it-works | Public | How fanclub works | None | None | None | Static |
| 14 | pages/Fanclub | /fanclub | Public | (above) | — | — | — | — |
| 15 | pages/FAQ | /faq | Public | FAQ page | None | None | None | Static |
| 16 | pages/News | /news | Public | News article listing | NewsCard | getPublicNews | NewsArticle(r) | — |
| 17 | pages/NewsDetail | /news/:slug | Public | Single news article | ShareArticle | getPublicNewsArticleBySlug | NewsArticle(r) | — |
| 18 | pages/BrandDetail | /brands/:slug | Public | Single brand page | VideoCard | getPublicBrands | Brand(r), Video(r) | — |
| 19 | pages/Brands | /brands | Public | Brand listing | BrandCard | getPublicBrands | Brand(r) | — |
| 20 | pages/SignContract | /sign-contract | Public | Contract signing page (token-gated) | None | contractService:get_for_signing, submit_signature | Contract(r/w), AuditLog(w) | — |
| 21 | pages/ApplicationUpload | /application-upload | Public | Token-gated media upload for applicants | MultiPhotoUpload | createApplicationUploadToken, finalizeTokenUpload | GuestProductionApplication(w) | — |
| 22 | pages/Terms | /terms | Public | Terms of service | None | None | None | Static legal |
| 23 | pages/Privacy | /privacy | Public | Privacy policy | None | None | None | Static legal |
| 24 | pages/DMCA | /dmca | Public | DMCA notice | None | None | None | Static legal |
| 25 | pages/Compliance2257 | /2257 | Public | 18 USC 2257 compliance page | None | None | None | Static legal — **CRITICAL: must exist for adult content compliance** |
| 26 | pages/Imprint | /imprint | Public | Imprint/legal notice | None | None | None | Static legal |
| 27 | pages/CookiePolicy | /cookie-policy | Public | Cookie policy | None | None | None | Static |
| 28 | pages/Account | /account | Protected (user) | User account settings | None | None | User(r/w) | — |
| 29 | pages/performer/PerformerLoginPage | /performer/login | Public | Performer-specific login (NOT Base44 auth) | AuthLayout | performerLogin | PerformerSession(w), Performer(r/w) | **CRITICAL: Separate auth system** |
| 30 | pages/performer/PerformerDashboard | /performer/dashboard | Performer | Performer portal shell | DashboardHeader, PerformerDashboardTabs | performerDashboardService:get_dashboard_summary, get_career_statistics, getPerformerProfilePrivate | Many (see service) | Auth via localStorage token, not Base44 session |
| 31 | pages/admin/Dashboard | /admin/dashboard | Admin | Admin console overview | StatCard | systemStatsService | SystemStat(r) | V1 migration status is hardcoded "Pending" |
| 32 | pages/admin/Videos | /admin/videos | Admin | Video list, publish toggle | VideoRow | publishVideoToWebsite (on toggle) | Video(r/w) | **BUG**: confirm dialog text is in German ("Video löschen?", "Löschen") |
| 33 | pages/admin/VideoEdit | /admin/videos/:id | Admin | Video metadata editor with asset tools | VideoIdentificationPanel, AICopyHelper, CategorySelector | retriggerVideoProcessing, validateVideoAssets, repairThumbnailOnly, generateVideoMetadata, checkAndApplyVideoAssets | Video(r/w), VideoAsset(r), VideoPerformer(r/w), Brand(r), Performer(r) | Very long file (1663 lines), duplicated validation panel rendered twice |
| 34 | pages/admin/VideoUploadTest | /admin/video-upload | Admin | Video upload with processing trigger | VideoUploadPanel | createR2UploadUrl, finalizeUploadedVideo | Video(w), VideoAsset(w), JobQueue(w) | — |
| 35 | pages/admin/Performers | /admin/performers | Admin | Performer list with server-side search | None | searchPerformers | Performer(r/w), VideoPerformer(r/w) | — |
| 36 | pages/admin/PerformerEdit | /admin/performers/new | Admin | Create new performer | None | None | Performer(w) | Very basic form — does not include revenue split, KYC, or compliance fields |
| 37 | pages/admin/PerformerDetailWrapper | /admin/performers/:id | Admin | 7-tab performer management shell | PerformerHeader, ProfileTab, ComplianceTab, EarningsTab, VideoStatsTab, VideosTab, FanclubTab, ProductionTab | performerAdminService, performerFinanceService, performerVideoStatsService, contractService | Performer(r/w), Contract(r/w), ComplianceRecord(r/w), VideoStatSnapshot(r/w), PerformerEarning(r/w) | — |
| 38 | pages/admin/MonthlyCloseout | /admin/monthly-closeout | Admin | Earnings generation from VideoStatSnapshots | None | monthlyCloseoutService | VideoStatSnapshot(r), PerformerEarning(w), AuditLog(w) | **BUG**: Only reads VideoStatSnapshot-based earnings; livecam/manual earnings in PerformerEarning are shown in "Existing Earnings" section only |
| 39 | pages/admin/Earnings | /admin/earnings | Admin | Manual earnings line item management | None | performerEarningLineItemService | PerformerEarningLineItem(r/w) | Default performer_share_percent in new line item is 70% — inconsistent with The_Fitmaster's 40% model |
| 40 | pages/admin/ContentReview | /admin/content-review | Admin | Publish-ready video review and publish | None | validatePublishSafety, publishVideoToWebsite, generatePromoKit | Video(r/w), VideoAsset(r), VideoPerformer(r), SEOPage(r/w), AuditLog(w) | **BUG**: Only shows videos with status=draft AND processing_status=draft_ready — misses other pre-publish states |
| 41 | pages/admin/Applications | /admin/applications | Admin | Guest production application management | SignedMediaItem | contractService, createApplicationUploadToken, getApplicationFileSignedUrl | GuestProductionApplication(r/w), Performer(w), Contract(w), ContractTemplate(r), AuditLog(w) | Largest single page file. Debug panel always visible in UI. |
| 42 | pages/admin/Brands | /admin/brands | Admin | Brand listing | None | None | Brand(r) | — |
| 43 | pages/admin/BrandEdit | /admin/brands/:id | Admin | Brand edit | None | None | Brand(r/w) | — |
| 44 | pages/admin/DraftReview | /admin/draft-review | Admin | AI metadata draft review | None | generateVideoMetadata | Video(r/w) | — |
| 45 | pages/admin/PayoutRequests | /admin/payout-requests | Admin | Performer payout request management | None | getPayoutRequests, approvePayoutRequest, rejectPayoutRequest, markPayoutRequestPaid | PayoutRequest(r/w) | — |
| 46 | pages/admin/PerformerSupport | /admin/performer-support | Admin | Support ticket management | None | performerSupportService | PerformerSupportRequest(r/w) | Double-filtering: server filter + client filter on same data |
| 47 | pages/admin/VideoPerformerMatch | /admin/video-performer-match | Admin | Quick video↔performer assignment | None | None | Video(r), Performer(r), VideoPerformer(r/w) | — |
| 48 | pages/admin/MissingPerformerAssignments | /admin/missing-performer-assignments | Admin | Videos without performer credits | None | None | Video(r), VideoPerformer(r) | — |
| 49 | pages/admin/UnlinkedPerformers | /admin/unlinked-performers | Admin | Performers without user_id link | None | None | Performer(r) | — |
| 50 | pages/admin/DuplicateVideos | /admin/duplicate-videos | Admin | Duplicate video detection | DuplicateVideoManager | analyzeVideoDuplicates, cleanupDuplicateVideos, deleteDuplicateVideos, findDuplicateVideos | Video(r/w) | **Diagnostic/maintenance page** |
| 51 | pages/admin/LegacyAssetInventory | /admin/legacy-assets | Admin | Legacy R2 URL inventory | None | generateLegacyAssetInventory, auditLegacyR2Urls | VideoAsset(r) | **Legacy/diagnostic page** |
| 52 | pages/admin/AssetRepairQueue | /admin/asset-repair-queue | Admin | Broken asset repair workflow | None | queueBrokenAssetRepairs, validateAndRepairVideoAssets | JobQueue(r/w), VideoAsset(r/w) | **Diagnostic/maintenance page** |
| 53 | pages/admin/AITextGenerator | /admin/ai-text-generator | Admin | AI copy generation tool | None | generateVideoTextFromIdea, generateExplicitVideoText | None | Internal tool |
| 54 | pages/admin/PromoKitDetail | /admin/promo-kit/:video_id | Admin | Promo kit view and export | None | generatePromoKit | Video(r), VideoPromoKit(r/w) | — |
| 55 | pages/admin/PerformerSubmissionsReview | /admin/performer-submissions | Admin | Content submission review | None | performerDashboardService:admin_update_submission, get_submission_download_url | ContentSubmission(r/w) | — |
| 56 | pages/LegacyVideoRedirect | /VideoDetail | Internal | V1 query-param redirect | None | None | Video(r) | — |
| 57 | pages/LegacyActorRedirect | /ActorDetail | Internal | V1 redirect | None | None | Performer(r) | — |
| 58 | pages/LegacyPerformerSlug | /:slug | Internal | V1 root-level performer slug redirect | None | None | Performer(r) | Wildcard catch-all — must stay last |
| 59 | pages/GhostRoute | Multiple | Internal | V1 dead paths, returns 404 | None | None | None | SEO safety noindex |
| 60 | pages/ComingSoon | Multiple admin | Admin | Placeholder for unbuilt admin pages | None | None | None | Used for /admin/news, /admin/seo, /admin/migration |

---

## SECTION 2 — FULL COMPONENT INVENTORY

| Component | Path | Used By | Purpose | Data Shape Expected | Issues / Risks |
|-----------|------|---------|---------|---------------------|----------------|
| PerformerDashboardTabs | components/performerDashboard/PerformerDashboardTabs | PerformerDashboard page | Root tab controller for performer portal | performer: {performer, career_stats} | Reads performerToken from localStorage on each render — not reactive |
| OverviewTab | components/performerDashboard/OverviewTab | PerformerDashboardTabs | Overview with earnings, compliance cards | performer obj, career_stats, performerToken | currentMonth is hardcoded to now() — cannot view other months |
| MyVideosTab | components/performerDashboard/MyVideosTab | PerformerDashboardTabs | Performer's video list | performerId, performerToken | — |
| PlatformStatsTab | components/performerDashboard/PlatformStatsTab | PerformerDashboardTabs | Platform revenue stats | performerId, performerToken, revenueSharePct | **BUG**: Uses `<option>` tags inside `<SelectContent>` (Radix) — should be `<SelectItem>`. Month filter will not render correctly. |
| EarningsTab (performer) | components/performerDashboard/EarningsTab | PerformerDashboardTabs | Performer earnings view | performerId | **DATA ISSUE**: Uses get_earnings action but maps earning.earning_type (legacy field) not earning.source_type — broken display for new line items; also does NOT pass performerToken |
| ComplianceTab (performer) | components/performerDashboard/ComplianceTab | PerformerDashboardTabs | Performer KYC/contracts/compliance view | performerId | Does NOT pass performerToken — depends on Base44 session auth to work |
| ContentUploadTab | components/performerDashboard/ContentUploadTab | PerformerDashboardTabs | File upload to R2 | performerId, performerToken | — |
| MySubmissionsTab | components/performerDashboard/MySubmissionsTab | PerformerDashboardTabs | Submission list | performerId, performerToken | — |
| SupportTab | components/performerDashboard/SupportTab | PerformerDashboardTabs | Support ticket form/list | None (uses Base44 user_id via performerSupportService) | **CRITICAL BUG**: SupportTab calls performerSupportService with Base44 user auth (base44.auth.me()) to link Performer via user_id. If performer has NO user_id on Performer record (e.g. The_Fitmaster has user_id: null), this WILL FAIL with 403 |
| ProfileAndPayoutTab | components/performerDashboard/ProfileAndPayoutTab | PerformerDashboardTabs | Profile, payout, identity verification | performer, performerToken | calls getPerformerProfilePrivate which uses Base44 user auth |
| DashboardHeader | components/performerDashboard/DashboardHeader | PerformerDashboard | Performer header/logout | performer obj | Also calls getPerformerProfilePrivate on mount via Base44 user auth — FAILS if no user_id linked |
| MonthlyCloseoutCard | components/performerDashboard/MonthlyCloseoutCard | OverviewTab | Monthly earnings summary | performerId, performerToken | Shows current month only |
| EarningsBreakdownTable | components/performerDashboard/EarningsBreakdownTable | OverviewTab | Earnings breakdown table | earnings[], summary | Date column shows paid_at fallback to period_month — always shows "N/A" for unpaid entries |
| ComplianceSummaryCard (performer) | components/performerDashboard/ComplianceSummaryCard | OverviewTab | Compliance summary | performer obj | Reads from performer data passed in (safe, from performerDashboardService) |
| ActionRequiredCard | components/performerDashboard/ActionRequiredCard | OverviewTab | Action alerts | performer obj | Pure display component, safe |
| PayoutReadinessCard | components/performerDashboard/PayoutReadinessCard | OverviewTab | Payout eligibility | performer obj | Pure display, safe |
| CareerStatisticsCard | components/performerDashboard/CareerStatisticsCard | OverviewTab | Career stats display | stats obj | Shows "Lifetime Earnings" from career_stats which is computed differently than per-period earnings |
| DetailedVideoCard | components/performerDashboard/DetailedVideoCard | MyVideosTab | Expandable video card | video obj (from get_videos) | Shows compliance_status as hardcoded "compliant" — not real data |
| LatestVideosCard | components/performerDashboard/LatestVideosCard | OverviewTab | Recent video tiles | performerId | — |
| PerformerHeader (admin) | components/performer/PerformerHeader | PerformerDetailWrapper | Admin performer status bar with actions | performer obj | — |
| ComplianceTab (admin) | components/performer/tabs/ComplianceTab | PerformerDetailWrapper | Admin compliance management | performer obj | Calls base44.entities.Contract.filter() directly — uses Base44 user auth, admin-only use |
| EarningsTab (admin) | components/performer/tabs/EarningsTab | PerformerDetailWrapper | Admin earnings management | performer obj | Uses performerFinanceService — reads PerformerEarning only, NOT PerformerEarningLineItem |
| VideoStatsTab (admin) | components/performer/tabs/VideoStatsTab | PerformerDetailWrapper | Admin video stats editor | performerId | Calls performerVideoStatsService — admin only |
| VideosTab (admin) | components/performer/tabs/VideosTab | PerformerDetailWrapper | **STUB — placeholder only** | performer obj | **BUG: Not implemented.** Just says "Video management — Phase 1 shell" |
| ProfileTab (admin) | components/performer/tabs/ProfileTab | PerformerDetailWrapper | Admin performer profile editor | performer obj | — |
| ProductionTab (admin) | components/performer/tabs/ProductionTab | PerformerDetailWrapper | Production compatibility profile | performer obj | — |
| FanclubTab (admin) | components/performer/tabs/FanclubTab | PerformerDetailWrapper | Fanclub management | performer obj | — |
| PerformerRouteHandler | components/PerformerRouteHandler | App.jsx | Auth guard for /performer/* | children | Accepts either localStorage performer token OR Base44 user auth. Mixed auth logic |
| VideoIdentificationPanel | components/admin/VideoIdentificationPanel | VideoEdit | Video preview with thumbnail/preview display | video, brands | — |
| PublishReadinessChecklist | components/admin/PublishReadinessChecklist | VideoEdit | Pre-publish checklist | video, form, selectedPerformerIds | — |
| PublishingDebugPanel | components/admin/PublishingDebugPanel | VideoEdit | Debug info for publishing | video, form, publishCheck | **Should be removed before production** |
| AICopyHelper | components/admin/AICopyHelper | VideoEdit | AI-generated copy | form, performerNames, brandName | — |
| VideoStatsSection | components/admin/video/VideoStatsSection | VideoEdit | Stats per video | videoId | Uses videoStatsImportService — admin only |
| VideoDealsSection | components/admin/video/VideoDealsSection | VideoEdit | Commercial deals per video | videoId | Uses videoDealService |
| VideoStatSnapshotModal | components/admin/video/VideoStatSnapshotModal | VideoStatsSection | Edit/create a stat snapshot | videoId | — |

---

## SECTION 3 — FULL FUNCTION INVENTORY

| Function | File Path | Called By | Auth | Entities Read | Entities Written | Role | Duplicate Candidate | Safe/Risky |
|----------|-----------|-----------|------|---------------|------------------|------|---------------------|------------|
| performerDashboardService | functions/performerDashboardService | Performer portal tabs | Performer session token (custom) | Performer, Video, VideoPerformer, VideoStatSnapshot, PerformerEarning, PerformerEarningLineItem, Contract, ComplianceRecord, ContentSubmission, Fanclub, PerformerSession | PerformerSession(last_login), ContentSubmission | Performer | monthlyCloseoutService, performerVideoStatsService | **RISKY** — monolithic 1000+ line function, divergent earnings logic |
| performerFinanceService | functions/performerFinanceService | EarningsTab (admin), PerformerDetailWrapper | Admin (Base44) | PerformerEarning, Performer, Video | PerformerEarning, AuditLog | Admin | performerDashboardService:get_earnings | Safe — but isolated from line item system |
| performerEarningLineItemService | functions/performerEarningLineItemService | Earnings (admin page) | Admin (Base44) | PerformerEarningLineItem, PerformerEarning, VideoStatSnapshot, Performer, Video, VideoPerformer | PerformerEarningLineItem, AuditLog | Admin | performerDashboardService:create_monthly_closeout | Safe |
| monthlyCloseoutService | functions/monthlyCloseoutService | MonthlyCloseout (admin page) | Admin (Base44) | VideoStatSnapshot, PerformerEarning, VideoPerformer, Performer, Video | PerformerEarning, AuditLog | Admin | performerEarningLineItemService:create_monthly_closeout | Safe — but default revenue_split_pct is 70% (not 40%) |
| performerAdminService | functions/performerAdminService | PerformerHeader, ProfileTab, KycSection, AccountControlsSection | Admin (Base44) | Performer, User | Performer, AuditLog | Admin | — | Safe — well-structured |
| performerComplianceService | functions/performerComplianceService | performerAdminService (unfreeze/KYC change triggers it) | Admin (Base44) | Performer, Contract, ComplianceRecord | Performer, AuditLog | Admin | — | Safe — critical compliance logic |
| performerSupportService | functions/performerSupportService | SupportTab (performer), PerformerSupport (admin) | Base44 user auth (performer needs user_id linked) | PerformerSupportRequest, Performer, User | PerformerSupportRequest, AuditLog | Both | — | **RISKY** — performer actions require Performer.user_id, which The_Fitmaster lacks |
| performerLogin | functions/performerLogin | PerformerLoginPage | Public (bcrypt verify) | Performer, PerformerSession | PerformerSession, Performer(last_login) | Public | — | **RISKY** — custom auth system, separate from Base44 |
| performerPasswordService | functions/performerPasswordService | (Admin performer management) | Admin | Performer | Performer | Admin | — | Handles bcrypt password management |
| performerVideoStatsService | functions/performerVideoStatsService | VideoStatsTab (admin) | Admin (Base44) | VideoStatSnapshot, VideoPerformer, Video | VideoStatSnapshot, AuditLog | Admin | videoStatsImportService | Duplicate of videoStatsImportService in get_performer_video_stats logic |
| videoStatsImportService | functions/videoStatsImportService | VideoStatsSection (admin VideoEdit) | Admin (Base44) | VideoStatSnapshot, Video | VideoStatSnapshot, AuditLog | Admin | performerVideoStatsService | Overlapping create_snapshot and update_snapshot with performerVideoStatsService |
| contractService | functions/contractService | Applications (admin), SignContract (public) | Mixed (public for signing, admin for create) | Contract, ContractTemplate, GuestProductionApplication, Performer, AuditLog | Contract, AuditLog | Both | — | Safe — but sends sensitive R2 snapshots |
| validatePublishSafety | functions/validatePublishSafety | ContentReview (admin) | Admin | Video, VideoPerformer, VideoAsset | None | Admin | publishVideoToWebsite (duplicated logic) | Safe — but **intentionally duplicated** with publishVideoToWebsite |
| publishVideoToWebsite | functions/publishVideoToWebsite | ContentReview (admin), Videos list toggle | Admin | Video, VideoPerformer, VideoAsset | Video, SEOPage, AuditLog | Admin | validatePublishSafety (duplicated logic) | **RISKY** — hardcoded note says "intentionally duplicated" but drift risk is real |
| createR2UploadUrl | functions/createR2UploadUrl | VideoUploadPanel (admin) | Admin | None | Video(draft), VideoAsset(pending) | Admin | getUploadUrl, createAdminFileUploadUrl | Functional but limited to video uploads |
| getUploadUrl | functions/getUploadUrl | Various compliance upload flows | Admin | Performer | None | Admin | createR2UploadUrl, createAdminFileUploadUrl | Simple R2 upload URL generator for compliance docs |
| createAdminFileUploadUrl | functions/createAdminFileUploadUrl | AdminFilePicker (admin compliance) | Admin | Performer | None | Admin | getUploadUrl, createR2UploadUrl | Most complete R2 upload URL generator — centralizes context types |
| createPerformerSubmissionUploadUrl | functions/createPerformerSubmissionUploadUrl | ContentUploadTab (performer portal) | Performer session token | ContentSubmission | ContentSubmission(w) | Performer | — | Safe |
| finalizeUploadedVideo | functions/finalizeUploadedVideo | VideoUploadPanel (admin) | Admin | VideoAsset | VideoAsset, Video, JobQueue | Admin | — | Safe — Phase 2C hardened |
| getPublicVideos | functions/getPublicVideos | Home, Videos pages | Public | Video, Brand, Performer, VideoPerformer | None | Public | — | **RISKY** — fetches up to 500 videos into memory for filtering |
| getPublicVideoDetail | functions/getPublicVideoDetail | (Legacy — VideoDetail page uses entity SDK now, not this function) | Public | Video, VideoPerformer, Performer, Brand | None | Public | — | **UNUSED** — VideoDetail.jsx does NOT call this function; calls entity SDK directly |
| getPublicPerformers | functions/getPublicPerformers | Home, Performers pages | Public | Performer, Brand, VideoPerformer, Video | None | Public | — | Safe |
| getVideoPlaybackUrl | functions/getVideoPlaybackUrl | VideoDetail page | User (authenticated) | Video, Subscription | None | User | — | Safe |
| searchPerformers | functions/searchPerformers | Performers (admin) | Admin | Performer | None | Admin | — | Safe but doesn't paginate correctly with search — totalCount estimate is wrong |
| systemStatsService | functions/systemStatsService | Dashboard (admin) | Admin | Video, Performer, Brand, NewsArticle, VideoPerformer | SystemStat | Admin | — | Safe — fetches up to 50000 VideoPerformer records |
| performerComplianceService | functions/performerComplianceService | performerAdminService | Admin | Performer, Contract, ComplianceRecord | Performer, AuditLog | Admin | — | Safe |
| analyzeVideoDuplicates | functions/analyzeVideoDuplicates | DuplicateVideos (admin) | Admin | Video | None | Admin | findDuplicateVideos | Diagnostic/maintenance |
| findDuplicateVideos | functions/findDuplicateVideos | DuplicateVideos (admin) | Admin | Video | None | Admin | analyzeVideoDuplicates | Diagnostic — near-duplicate of analyzeVideoDuplicates |
| cleanupDuplicateVideos | functions/cleanupDuplicateVideos | DuplicateVideos (admin) | Admin | Video | Video | Admin | deleteDuplicateVideos | **DESTRUCTIVE** |
| deleteDuplicateVideos | functions/deleteDuplicateVideos | DuplicateVideos (admin) | Admin | Video | Video | Admin | cleanupDuplicateVideos | **DESTRUCTIVE** |
| auditBrokenVideoAssets | functions/auditBrokenVideoAssets | AssetRepairQueue | Admin | VideoAsset, Video | None | Admin | — | Diagnostic |
| queueBrokenAssetRepairs | functions/queueBrokenAssetRepairs | AssetRepairQueue | Admin | VideoAsset | JobQueue | Admin | — | Maintenance |
| validateAndRepairVideoAssets | functions/validateAndRepairVideoAssets | AssetRepairQueue | Admin | VideoAsset, Video | VideoAsset, Video | Admin | validateAndFixVideoAssets | **DUPLICATE** |
| validateAndFixVideoAssets | functions/validateAndFixVideoAssets | (Not in any current page — possible legacy) | Admin | VideoAsset, Video | VideoAsset, Video | Admin | validateAndRepairVideoAssets | **POSSIBLE LEGACY** |
| repairCorruptThumbnail | functions/repairCorruptThumbnail | VideoEdit | Admin | VideoAsset, Video | VideoAsset, Video | Admin | repairThumbnailOnly | Overlapping purpose |
| repairThumbnailOnly | functions/repairThumbnailOnly | VideoEdit | Admin | VideoAsset, Video | VideoAsset, Video, JobQueue | Admin | repairCorruptThumbnail | Overlapping purpose |
| repairSourceVideoUrl | functions/repairSourceVideoUrl | VideoEdit | Admin | Video, VideoAsset | Video | Admin | — | Safe |
| retriggerVideoProcessing | functions/retriggerVideoProcessing | VideoEdit | Admin | Video, VideoAsset | Video, JobQueue | Admin | — | Safe |
| checkAndApplyVideoAssets | functions/checkAndApplyVideoAssets | VideoEdit | Admin | Video, VideoAsset | Video | Admin | — | Safe |
| validateVideoAssets | functions/validateVideoAssets | VideoEdit, ContentReview | Admin | Video, VideoAsset | None | Admin | validateVideoAsset(Accessibility), quickAssetValidation | **Multiple overlapping validators** |
| quickAssetValidation | functions/quickAssetValidation | (Unknown — likely legacy) | Admin? | VideoAsset | None | Admin | validateVideoAssets | **POSSIBLE LEGACY** |
| validateVideoAssetAccessibility | functions/validateVideoAssetAccessibility | (Unknown) | Admin? | VideoAsset | None | Admin | validateVideoAssets | **POSSIBLE LEGACY** |
| validateThumbnailImage | functions/validateThumbnailImage | VideoEdit | Admin | Video | None | Admin | — | Diagnostic |
| diagnoseVideoAssets | functions/diagnoseVideoAssets | VideoEdit | Admin | Video, VideoAsset | None | Admin | — | Diagnostic |
| testVideoUrls | functions/testVideoUrls | (Unknown — possible legacy) | Admin? | Video | None | Admin | — | **Diagnostic/legacy** |
| getProcessingJobStatus | functions/getProcessingJobStatus | VideoEdit (job polling) | Admin | JobQueue | None | Admin | — | Safe |
| updateVideoProcessingResult | functions/updateVideoProcessingResult | External processor callback | Processor key auth | Video, VideoAsset, JobQueue | Video, VideoAsset, JobQueue | Processor | — | Safe |
| checkStuckProcessingJobs | functions/checkStuckProcessingJobs | (Unknown — possibly scheduled or manual) | Admin | JobQueue | JobQueue | Admin | markOldJobsAsTimeout | **Should be automated, check if automation exists** |
| markOldJobsAsTimeout | functions/markOldJobsAsTimeout | (Unknown — possibly scheduled or manual) | Admin | JobQueue | JobQueue | Admin | checkStuckProcessingJobs | **Should be automated** |
| checkExternalProcessorHealth | functions/checkExternalProcessorHealth | (Unknown) | Admin | None | None | Admin | — | Diagnostic |
| simulateProcessorCallback | functions/simulateProcessorCallback | (Unknown) | Admin | None | None | Admin | — | **Diagnostic/test function** |
| diagnoseCallbackPath | functions/diagnoseCallbackPath | (Unknown) | Admin | None | None | Admin | — | **Diagnostic/test function** |
| generateVideoMetadata | functions/generateVideoMetadata | VideoEdit, DraftReview | Admin | Video | Video | Admin | — | Safe — calls LLM |
| generateMissingMetaSuggestions | functions/generateMissingMetaSuggestions | (Unknown) | Admin | Video | Video | Admin | generateVideoMetadata | **Possible legacy** |
| analyzeVideoMetadata | functions/analyzeVideoMetadata | (Unknown) | Admin | Video | None | Admin | — | Diagnostic |
| batchUpdateVideoMetadataSafe | functions/batchUpdateVideoMetadataSafe | (Unknown — manual batch operation) | Admin | Video | Video, AuditLog | Admin | — | Safe but powerful |
| generatePromoKit | functions/generatePromoKit | ContentReview, PromoKitDetail | Admin | Video, VideoPerformer, Performer, Brand | VideoPromoKit | Admin | — | Safe |
| markExternalPosted | functions/markExternalPosted | (Unknown) | Admin | VideoPromoKit | VideoPromoKit | Admin | — | Safe |
| publishVideoToWebsite | functions/publishVideoToWebsite | ContentReview, Videos list | Admin | Video, VideoPerformer, VideoAsset | Video, SEOPage, AuditLog | Admin | validatePublishSafety | **RISKY — duplicate validation logic** |
| autoPublishVideo | functions/autoPublishVideo | (Unknown — possible automation) | Admin? | Video | Video, SEOPage, AuditLog | Internal | publishVideoToWebsite | **POSSIBLE DUPLICATE** |
| generateLegacyAssetInventory | functions/generateLegacyAssetInventory | LegacyAssetInventory (admin) | Admin | VideoAsset, Video | None | Admin | — | Maintenance |
| auditLegacyR2Urls | functions/auditLegacyR2Urls | LegacyAssetInventory (admin) | Admin | VideoAsset | None | Admin | — | Maintenance |
| migrateLegacyR2Urls | functions/migrateLegacyR2Urls | LegacyAssetInventory (admin) | Admin | VideoAsset, Video | VideoAsset, Video | Admin | — | **DESTRUCTIVE MIGRATION** |
| deleteUnassignedVideos | functions/deleteUnassignedVideos | (Unknown — manual operation) | Admin | VideoPerformer, Video | Video | Admin | — | **DESTRUCTIVE** |
| sitemapXml | functions/sitemapXml | (Unknown — likely crawled directly) | Public | Video, Performer, Brand, NewsArticle | None | Public | — | Safe |
| seoVideoAudit | functions/seoVideoAudit | (Unknown) | Admin? | Video, SEOPage | None | Admin | — | Diagnostic |
| seoGa4TopPages | functions/seoGa4TopPages | (Unknown — SEO admin pages) | Admin | None (GA4 API) | None | Admin | — | Safe — uses GA4 connector |
| seoGscSearchAnalytics | functions/seoGscSearchAnalytics | (Unknown) | Admin | None (GSC API) | None | Admin | — | Safe — uses GSC connector |
| seoGscInspectUrl | functions/seoGscInspectUrl | (Unknown) | Admin | None (GSC API) | None | Admin | — | Safe |
| seoGscSubmitSitemap | functions/seoGscSubmitSitemap | (Unknown) | Admin | None (GSC API) | None | Admin | — | Safe |
| seoGscGetSitemapStatus | functions/seoGscGetSitemapStatus | (Unknown) | Admin | None (GSC API) | None | Admin | — | Safe |
| submitPerformerApplication | functions/submitPerformerApplication | BecomePerformer page | Public | None | GuestProductionApplication(w) | Public | — | Safe |
| createApplicationUploadUrl | functions/createApplicationUploadUrl | ApplicationUpload page | Token | None | None | Public | createApplicationUploadToken | Safe |
| createApplicationUploadToken | functions/createApplicationUploadToken | Applications (admin) | Admin | GuestProductionApplication | None | Admin | — | Safe |
| getApplicationFileSignedUrl | functions/getApplicationFileSignedUrl | Applications (admin) | Admin | GuestProductionApplication | None | Admin | — | Safe |
| finalizeTokenUpload | functions/finalizeTokenUpload | ApplicationUpload page | Token | GuestProductionApplication | GuestProductionApplication(w) | Public | — | Safe |
| uploadFileViaToken | functions/uploadFileViaToken | ApplicationUpload page | Token | None | None | Public | — | Safe |
| createPerformerPayoutRequest | functions/createPerformerPayoutRequest | PayoutRequestsSection (performer portal) | Performer (Base44 user auth via user_id) | Performer, PerformerEarning | PayoutRequest | Performer | — | **RISKY** — requires user_id linked on Performer |
| getPayoutRequests | functions/getPayoutRequests | PayoutRequests (admin) | Admin | PayoutRequest, Performer | None | Admin | getPerformerPayoutRequests | — |
| getPerformerPayoutRequests | functions/getPerformerPayoutRequests | ProfileAndPayoutTab (performer) | Performer (Base44 auth) | PayoutRequest, Performer | None | Performer | getPayoutRequests | **RISKY** — requires user_id |
| approvePayoutRequest | functions/approvePayoutRequest | PayoutRequests (admin) | Admin | PayoutRequest | PayoutRequest, AuditLog | Admin | — | Safe |
| rejectPayoutRequest | functions/rejectPayoutRequest | PayoutRequests (admin) | Admin | PayoutRequest | PayoutRequest, AuditLog | Admin | — | Safe |
| markPayoutRequestPaid | functions/markPayoutRequestPaid | PayoutRequests (admin) | Admin | PayoutRequest | PayoutRequest, AuditLog | Admin | — | Safe |
| updatePerformerPayoutMethod | functions/updatePerformerPayoutMethod | PayoutMethodSection | Performer (Base44 auth) | PerformerProfilePrivate | PerformerProfilePrivate | Performer | — | **RISKY** — requires user_id |
| updatePerformerContactInfo | functions/updatePerformerContactInfo | PersonalProfileSection | Performer (Base44 auth) | PerformerProfilePrivate | PerformerProfilePrivate | Performer | — | **RISKY** — requires user_id |
| getPerformerProfilePrivate | functions/getPerformerProfilePrivate | DashboardHeader, ProfileAndPayoutTab | Performer (Base44 auth) | Performer, PerformerProfilePrivate | None | Performer | — | **RISKY** — requires user_id |
| identityVerificationService | functions/identityVerificationService | IdentityVerificationTab | Performer (Base44 auth) | IdentityVerificationSession, Performer | IdentityVerificationSession | Performer | — | **RISKY** — requires user_id |
| identityVerificationWebhook | functions/identityVerificationWebhook | External (webhook) | Provider signature | IdentityVerificationSession, Performer | IdentityVerificationSession, Performer | External | — | Safe |
| performerIdVerificationService | functions/performerIdVerificationService | AdminIdDocumentsSection | Admin | ComplianceRecord, Performer | ComplianceRecord | Admin | identityVerificationService | Overlapping verification purposes |
| complianceRecordService | functions/complianceRecordService | ComplianceRecordsSection | Admin | ComplianceRecord, Performer | ComplianceRecord, AuditLog | Admin | — | Safe |
| complianceDocumentService | functions/complianceDocumentService | (Unknown) | Admin | ComplianceDocument | ComplianceDocument | Admin | complianceRecordService | **Possible legacy — ComplianceDocument entity exists but ComplianceRecord is primary** |
| createDocumentUploadUrl | functions/createDocumentUploadUrl | ContractsSection | Admin | Performer | None | Admin | getComplianceUploadUrl, createAdminFileUploadUrl | **DUPLICATE** R2 URL generator |
| getComplianceUploadUrl | functions/getComplianceUploadUrl | UploadComplianceDocumentModal | Admin | Performer | None | Admin | createDocumentUploadUrl, createAdminFileUploadUrl | **DUPLICATE** R2 URL generator |
| getComplianceDocumentSignedUrl | functions/getComplianceDocumentSignedUrl | ComplianceRecordsSection | Admin | ComplianceRecord | None | Admin | getAdminFileViewUrl | — |
| getAdminFileViewUrl | functions/getAdminFileViewUrl | AdminFileViewModal | Admin | None | None | Admin | getComplianceDocumentSignedUrl | Overlapping signed URL generation |
| getAdminPerformerPrivateProfile | functions/getAdminPerformerPrivateProfile | Admin compliance sections | Admin | Performer, PerformerProfilePrivate | None | Admin | — | Safe |
| submitPerformerProfileChangeRequest | functions/submitPerformerProfileChangeRequest | ProfileAndPayoutTab | Performer (Base44 auth) | ProfileChangeRequest, Performer | ProfileChangeRequest | Performer | — | **RISKY** — requires user_id |
| approvePerformerProfileChange | functions/approvePerformerProfileChange | Admin (unknown page) | Admin | ProfileChangeRequest, Performer | Performer, ProfileChangeRequest | Admin | — | Safe |
| rejectPerformerProfileChange | functions/rejectPerformerProfileChange | Admin (unknown page) | Admin | ProfileChangeRequest | ProfileChangeRequest | Admin | — | Safe |
| createCheckoutSession | functions/createCheckoutSession | CheckoutButton (various public pages) | User (Base44 auth) | User, PaymentIntent | PaymentIntent | User | — | Safe |
| paymentWebhook | functions/paymentWebhook | NowPayments provider webhook | Provider signature | PaymentIntent, Subscription, User | PaymentIntent, Subscription, User | External | — | Safe |
| checkPaymentProviderStatus | functions/checkPaymentProviderStatus | CheckoutButton | User | None | None | User | — | Safe |
| getPricingPlanSection | functions/getPricingPlanSection | (Unknown — pricing config) | Public? | None | None | Public | — | Safe |
| videoDealService | functions/videoDealService | VideoDealsSection | Admin | VideoDeal, Video | VideoDeal, AuditLog | Admin | — | Safe |
| checkAdminRole | functions/checkAdminRole | (Unknown — legacy check) | Admin | User | None | Admin | — | **Likely legacy** — AdminGuard component handles this |
| setAdminRole | functions/setAdminRole | (Unknown — manual operation) | Admin | User | User | Admin | — | Safe |
| generateVideoTextFromIdea | functions/generateVideoTextFromIdea | AITextGenerator (admin) | Admin | None | None | Admin | — | Safe |
| generateExplicitVideoText | functions/generateExplicitVideoText | AITextGenerator (admin) | Admin | None | None | Admin | — | Safe |
| shared/aiVideoTextPrompt | functions/shared/aiVideoTextPrompt | generateVideoTextFromIdea, generateExplicitVideoText | Internal | None | None | Internal | — | Shared helper (unusual pattern in Base44) |
| shared/assetValidation | functions/shared/assetValidation | (Multiple asset validators) | Internal | None | None | Internal | — | Shared helper |
| utils/publishSafety | functions/utils/publishSafety | publishVideoToWebsite? | Internal | None | None | Internal | — | **CONFLICT**: Code comment says "shared helpers not supported reliably" yet this exists |
| findAssetValidationTestCandidates | functions/findAssetValidationTestCandidates | AssetRepairQueue | Admin | VideoAsset | None | Admin | — | Diagnostic |
| getVideoUploadStatus | functions/getVideoUploadStatus | VideoUploadPanel | Admin | JobQueue, Video | None | Admin | getProcessingJobStatus | **POSSIBLE DUPLICATE** |
| getPublicBrands | functions/getPublicBrands | Brands, BrandDetail pages | Public | Brand | None | Public | — | Safe |
| getPublicNews | functions/getPublicNews | News, Home pages | Public | NewsArticle | None | Public | — | Safe |
| getPublicNewsArticleBySlug | functions/getPublicNewsArticleBySlug | NewsDetail page | Public | NewsArticle | None | Public | — | Safe |
| performerSupportService | functions/performerSupportService | SupportTab, PerformerSupport | Both | PerformerSupportRequest, Performer, User | PerformerSupportRequest, AuditLog | Both | — | **RISKY** — performer auth requires user_id |

---

## SECTION 4 — FULL SERVICE INVENTORY

| Service File | Responsibility | Key Actions | Overlap Issues |
|-------------|---------------|-------------|----------------|
| performerDashboardService | Monolithic performer portal service. Login validation, dashboard summary, earnings, videos, compliance, stats, fanclub, submissions | get_dashboard_summary, get_earnings, get_videos, get_video_stats, get_compliance, get_career_statistics, get_fanclub, get_content_submissions, create_support_request, update_submission_uploaded, admin_update_submission, create_document_signed_url | **Overlaps with**: performerVideoStatsService (video stats logic), performerFinanceService (earnings logic), performerSupportService (support requests), complianceRecordService |
| monthlyCloseoutService | Admin batch earnings generation from VideoStatSnapshot | get_closeout_preview, generate_draft_earnings, batch_update_status | Uses PerformerEarning (old entity). Default revenue split 70% (not 40%). Only handles video platform stats. |
| performerFinanceService | Admin per-performer earnings CRUD (PerformerEarning entity) | create_earning, update_earning_status, list_earnings_for_period, calculate_period_summary, update_outstanding_balance | Uses PerformerEarning only, not PerformerEarningLineItem. SDK version 0.8.25 (older) |
| performerEarningLineItemService | Admin line item management (PerformerEarningLineItem entity) | create_line_item, update_line_item, delete_line_item, list_line_items, aggregate_period_summary, create_monthly_closeout, approve_closeout, mark_closeout_paid | The "correct" modern earnings system. Not connected to performer portal dashboard. |
| performerAdminService | Admin performer account management with full audit trail | get_performer, update_performer, freeze_account, unfreeze_account, set_kyc_status, set_revenue_split, update_platform_accounts, link_user, unlink_user, invite_performer_user | SDK 0.8.25. Triggers performerComplianceService. |
| performerComplianceService | Compliance evaluation and locking | compliance_check, lock_evaluation, manual_unlock, manual_lock | Called by performerAdminService. Duplicate logic for contract validity check in compliance_check vs lock_evaluation actions. |
| performerSupportService | Support ticket CRUD | create_request, list_my_requests, admin_list_requests, admin_update_request | SDK 0.8.30. Requires Performer.user_id for performer-side actions. |
| performerVideoStatsService | Admin video stats per performer | get_performer_video_stats, create_snapshot, update_snapshot | Overlaps with videoStatsImportService (both create/update VideoStatSnapshot) |
| videoStatsImportService | Admin video stats import/management per video | create_snapshot, list_snapshots_for_video | Overlaps with performerVideoStatsService. Different create_snapshot implementations |
| contractService | Contract lifecycle management | get_for_signing (public), submit_signature (public), create_from_application (admin), get_contract_snapshot (admin), send_for_signature (admin) | R2 storage for contracts. Revenue model correctly uses dynamic 40/60 or 70/30 |
| performerLogin | Performer-specific username+password auth | (Single action) | Creates PerformerSession records. Separate from Base44 auth. |
| performerPasswordService | Performer password management | set_password, change_password | Handles bcrypt hashing |
| systemStatsService | Dashboard counter cache | refresh_dashboard_stats | Fetches up to 50000 records |
| videoDealService | Commercial deal management per video | CRUD on VideoDeal | Safe |
| complianceRecordService | ComplianceRecord CRUD with audit | CRUD operations | Safe |
| complianceDocumentService | ComplianceDocument CRUD | CRUD operations | **ComplianceDocument entity exists but purpose unclear vs ComplianceRecord** |
| performerComplianceService | Compliance lock/evaluation | See above | — |

---

## SECTION 5 — FULL ENTITY MATRIX

| Entity | Purpose | Read By | Written By | Overlaps | Missing Fields | Source of Truth Issues |
|--------|---------|---------|-----------|---------|----------------|------------------------|
| Performer | Central performer profile, all compliance/earnings flags | Everywhere | performerAdminService, PerformerEdit, ProfileTab | — | `revenue_split_pct` default 40% set on entity but defaulted to 70% in services | **Primary truth** for kyc_status, compliance_locked |
| Video | Video metadata, status, asset URLs | Everywhere | VideoEdit, finalizeUploadedVideo, publishVideoToWebsite, updateVideoProcessingResult | — | `website_published_at` field referenced in publishVideoToWebsite but NOT in Video entity schema | `status` managed in two places: VideoEdit direct and publishVideoToWebsite |
| VideoPerformer | Video↔Performer many-to-many junction | VideoEdit, VideoDetail, getPublicVideos, performerDashboardService | VideoEdit, searchPerformers | — | Missing `credit_status` field (used in frontend) — derived in service | — |
| VideoAsset | Individual asset records (source, thumbnail, preview) | VideoEdit, AssetRepairQueue | finalizeUploadedVideo, updateVideoProcessingResult, repairThumbnailOnly, checkAndApplyVideoAssets | Video entity also stores URLs directly | R2 key vs CDN URL duplication with Video.primary_thumbnail_url | **Conflict**: Video entity stores thumbnail_url AND VideoAsset entity tracks thumbnail separately |
| VideoStatSnapshot | Platform revenue/views per video per period | performerDashboardService, monthlyCloseoutService, performerVideoStatsService, VideoStatsSection | videoStatsImportService, performerVideoStatsService | ExternalVideo entity also has revenue model | `source_type` field: "internal" by default on all records even xHamster ones | **Primary** video performance source |
| PerformerEarning | Legacy earnings records (older system) | performerDashboardService, monthlyCloseoutService, performerFinanceService | monthlyCloseoutService, performerFinanceService | PerformerEarningLineItem | Uses `earning_type` (xhamster_share, livestream) vs `source_type` (video_platform, livecam) inconsistency | **CONFLICT**: Two parallel earnings systems |
| PerformerEarningLineItem | Modern earnings line items (newer system) | performerDashboardService, performerEarningLineItemService | performerEarningLineItemService | PerformerEarning | — | **CONFLICT**: Admin Earnings page uses this; Admin MonthlyCloseout uses PerformerEarning |
| Contract | Legal contracts for performers | CompliancTab, contractService, performerComplianceService | contractService | — | `performer_signed_at` AND `signed_at` both exist — redundant | `status: signed` but `signed_at: null` on The_Fitmaster's contract — inconsistency |
| ComplianceRecord | ID docs, medical tests, compliance docs | ComplianceTab, performerComplianceService | complianceRecordService, AdminIdDocumentsSection | ComplianceDocument entity | No `is_medical_test` boolean — type matching is string-based and brittle | performerComplianceService checks document_type in ['medical_test','std_test'] — but all The_Fitmaster records are type 'id' and 'other' — compliance check fails |
| PerformerSession | Custom auth sessions for performer login | performerDashboardService | performerLogin | — | `revoked` field exists but not checked in performerDashboardService | Sessions accumulate — no cleanup; expired sessions never deleted |
| JobQueue | Async processing job tracking | VideoEdit, getProcessingJobStatus | finalizeUploadedVideo, retriggerVideoProcessing | — | — | Jobs can get stuck in 'running' status permanently |
| GuestProductionApplication | Guest production applications | Applications admin, ApplicationUpload | submitPerformerApplication, Applications admin | — | performer_id not stored directly — extracted from admin_notes string (fragile) | — |
| SystemStat | Dashboard cache | Dashboard admin | systemStatsService | — | — | Single singleton record — brittle |
| AuditLog | Immutable action log | Nowhere (write-only effectively) | Many services | — | — | — |
| SEOPage | SEO metadata per page | (Unknown — seoVideoAudit?) | publishVideoToWebsite | Video entity also has meta_title/meta_description | — | Duplicate SEO data between Video and SEOPage |
| ContentSubmission | Performer content uploads for review | MySubmissionsTab, PerformerSubmissionsReview | createPerformerSubmissionUploadUrl | — | — | — |
| Brand | Studio/label grouping | VideoEdit, VideoDetail, etc | BrandEdit | — | — | — |
| Fanclub | Performer fanclub settings | FanclubTab | FanclubTab | Subscription entity | — | — |
| Subscription | User fanclub subscriptions | (Unknown) | paymentWebhook | Fanclub | — | — |
| Payment | Payment records | (Unknown) | paymentWebhook | PaymentIntent | — | — |
| PaymentIntent | Checkout sessions | (Unknown) | createCheckoutSession | Payment | — | — |
| PayoutRequest | Performer payout requests | PayoutRequests admin | createPerformerPayoutRequest | — | — | — |
| PerformerProfilePrivate | Private performer profile (payout details) | ProfileAndPayoutTab | updatePerformerContactInfo, updatePerformerPayoutMethod | Performer entity | Purpose unclear vs Performer entity | **DUPLICATION RISK** |
| PerformerSupportRequest | Support tickets | PerformerSupport admin, SupportTab | performerSupportService | — | — | — |
| ContractTemplate | Contract HTML templates | Applications admin, contractService | (Manual admin creation) | — | — | — |
| IdentityVerificationSession | External ID verification sessions | IdentityVerificationTab | identityVerificationService | ComplianceRecord | — | — |
| ComplianceDocument | (Legacy?) compliance document entity | complianceDocumentService | complianceDocumentService | ComplianceRecord | Purpose unclear | **POSSIBLE LEGACY** — primary compliance uses ComplianceRecord |
| ProfileChangeRequest | Performer-requested profile changes | (Admin flow) | submitPerformerProfileChangeRequest | — | — | — |
| ExternalVideo | External platform video tracking | (Unknown — VideoStatsSection?) | (Unknown) | Video entity | — | **POSSIBLE UNUSED** — not referenced in current performer dashboard |
| VideoDeal | Sponsorship/commercial deals | VideoDealsSection | videoDealService | — | — | — |
| VideoPromoKit | Promo kit assets | PromoKitDetail admin | generatePromoKit | — | — | — |
| SEOPage | SEO metadata | (Unknown) | publishVideoToWebsite | Video | — | — |
| SlugRedirect | V1→V2 slug redirects | LegacyPerformerSlug | (Manual) | — | — | — |
| NewsArticle | News/blog articles | News, NewsDetail, Home | (Admin CMS — coming soon) | — | — | — |
| GeoAvailability, GeoPolicy, GeoRule, GeoAudit | Geo-restriction rules | (Unknown — not used in any current page) | (Unknown) | — | — | **Appear unused in UI** |
| FanclubContent | Fanclub exclusive content | (Unknown — not used in any current page) | (Unknown) | — | — | **Appear unused in UI** |
| PerformerStat | Aggregate performer stats cache | (Unknown) | (Unknown) | Computed from VideoStatSnapshot | — | **Possible unused** |
| PageView, VideoView | Analytics event logs | (Unknown) | (Unknown) | GA4 | — | **May be orphan data** |
| NotificationLog | Notification records | (Unknown) | (Unknown) | — | — | **Appear unused** |

---

## SECTION 6 — DUPLICATION AUDIT

### Group A: Earnings Calculators
**Files involved**: `performerDashboardService` (get_earnings), `performerFinanceService` (calculate_period_summary), `performerEarningLineItemService` (aggregate_period_summary), `monthlyCloseoutService` (generate_draft_earnings)

**Differences**: 
- performerDashboardService aggregates PerformerEarning + PerformerEarningLineItem + VideoStatSnapshot dynamically
- performerFinanceService works only on PerformerEarning (legacy)
- performerEarningLineItemService works only on PerformerEarningLineItem (new)
- monthlyCloseoutService generates PerformerEarning records from VideoStatSnapshot

**Recommended canonical**: Unify under `performerEarningLineItemService`. All earnings should be PerformerEarningLineItem records. PerformerEarning should be deprecated.

**Merge risk**: HIGH — multiple admin pages and performer portal depend on different services.

**Priority**: HIGH

---

### Group B: Video Stats Loaders
**Files**: `performerVideoStatsService:get_performer_video_stats`, `performerDashboardService:get_video_stats`, `videoStatsImportService:list_snapshots_for_video`

**Differences**: 
- All three independently query VideoStatSnapshot for performer's videos
- performerDashboardService:get_video_stats used by performer portal PlatformStatsTab
- performerVideoStatsService used by admin VideoStatsTab
- videoStatsImportService used by admin VideoStatsSection on VideoEdit

**Recommended canonical**: Single `videoStatService` with role-based filtering.

**Priority**: MEDIUM

---

### Group C: VideoStatSnapshot Create/Update
**Files**: `videoStatsImportService:create_snapshot`, `performerVideoStatsService:create_snapshot`

**Differences**: Both create VideoStatSnapshot records. videoStatsImportService is more complete (has upsert logic, checks for existing). performerVideoStatsService is simpler.

**Recommended canonical**: videoStatsImportService.

**Priority**: MEDIUM

---

### Group D: R2 Upload URL Generators
**Files**: `createR2UploadUrl` (video upload, admin), `getUploadUrl` (compliance docs), `createAdminFileUploadUrl` (centralized admin), `createDocumentUploadUrl` (contracts), `getComplianceUploadUrl` (compliance), `createPerformerSubmissionUploadUrl` (performer submissions), `createApplicationUploadUrl` (applications)

**All do the same thing**: generate a signed R2 PUT URL. All initialize S3Client with same R2 credentials. All use different path structures.

**Recommended canonical**: `createAdminFileUploadUrl` is most complete. Replace others with calls to it, parameterizing the context_type.

**Priority**: LOW (functional, not broken)

---

### Group E: Compliance/KYC Resolvers
**Files**: `performerComplianceService:compliance_check`, `components/performer/tabs/ComplianceSummaryCard`, `components/performerDashboard/ComplianceSummaryCard`, `components/performerDashboard/ActionRequiredCard`, `components/performerDashboard/PayoutReadinessCard`

**Differences**: Each independently reads performer status fields (kyc_status, compliance_locked, account_status) and generates its own interpretation. No single canonical compliance status object.

**Problem**: The admin `ComplianceSummaryCard` and performer portal `ComplianceSummaryCard` are separate files with different logic. Neither calls `performerComplianceService`.

**Recommended canonical**: `performerComplianceService:compliance_check` should be the single source of truth. Frontend should display its result.

**Priority**: HIGH

---

### Group F: Publish/Validation Functions
**Files**: `validatePublishSafety`, `publishVideoToWebsite`, `utils/publishSafety`, `VideoEdit.jsx (hardBlockingReasons)`, `Videos.jsx (publishReadinessGuardrails)`

**The validation logic exists in at least 5 places**:
1. Backend `validatePublishSafety.js`
2. Backend `publishVideoToWebsite.js` (intentionally duplicated per comment)
3. Frontend `VideoEdit.jsx` lines 551-563 (hardBlockingReasons)
4. Frontend `Videos.jsx` (imports from publishReadinessGuardrails.js)
5. `utils/publishSafety.js` (exists but comment says "shared helpers not reliable")

**Recommended canonical**: A single backend validation function called by both validatePublishSafety and publishVideoToWebsite.

**Priority**: HIGH

---

### Group G: Performer Dashboard Loaders
**Files**: `performerDashboardService:get_dashboard_summary`, `DashboardHeader` (calls getPerformerProfilePrivate separately), `ProfileAndPayoutTab` (calls getPerformerProfilePrivate separately)

**Problem**: DashboardHeader and ProfileAndPayoutTab both independently call `getPerformerProfilePrivate` which uses Base44 user auth (requiring user_id). The main dashboard already loaded performer data via performerDashboardService (which uses session token). This causes redundant loads and will fail for performers without user_id.

**Recommended canonical**: Pass performer data down from PerformerDashboard page rather than each component fetching independently.

**Priority**: HIGH

---

### Group H: Status Badge/Status Mapper Logic
**Files**: Scattered throughout all pages and components. Each defines its own `statusColors`, `STATUS_CONFIG`, `STATUS_COLOR` maps.

**Examples**: 
- VideoEdit has STATUS_COLORS
- PerformerHeader has kycBadgeColors and statusBadgeColors  
- MonthlyCloseout has its own Badge variants
- EarningsTab, EarningsBreakdownTable, ComplianceTab each define status-to-style maps

**Recommended canonical**: Create a `lib/statusUtils.js` with shared status color/label maps.

**Priority**: LOW

---

## SECTION 7 — DEAD / LEGACY / DIAGNOSTIC CODE AUDIT

| Item | Type | Evidence | Safe to Remove? | Proof Needed |
|------|------|----------|----------------|--------------|
| functions/simulateProcessorCallback | Diagnostic | Name contains "simulate" | **Uncertain** | Check if any page calls it |
| functions/diagnoseCallbackPath | Diagnostic | Name contains "diagnose" | **Uncertain** | Check if any page calls it |
| functions/diagnoseVideoAssets | Diagnostic | Name contains "diagnose" | **Uncertain** | Check if VideoEdit still calls it |
| functions/testVideoUrls | Diagnostic | Name contains "test" | **Uncertain** | Check callers |
| functions/checkExternalProcessorHealth | Diagnostic | Rarely needed | Uncertain | Check if any automation uses it |
| functions/quickAssetValidation | Possible legacy | Not referenced in any current page file reviewed | Uncertain | Need full codebase search |
| functions/validateVideoAssetAccessibility | Possible legacy | Not referenced in any current page file reviewed | Uncertain | Need codebase search |
| functions/validateAndFixVideoAssets | Possible legacy | AssetRepairQueue uses validateAndRepairVideoAssets | Uncertain | Need codebase search |
| functions/findDuplicateVideos | Near-duplicate | Very similar to analyzeVideoDuplicates | No | In use by DuplicateVideos page |
| functions/autoPublishVideo | Possible legacy | Not referenced in any reviewed page | **Uncertain** | Need codebase search |
| functions/generateMissingMetaSuggestions | Possible legacy | Not referenced in any reviewed page | Uncertain | Need codebase search |
| functions/analyzeVideoMetadata | Diagnostic | Name contains "analyze" | Uncertain | Need codebase search |
| functions/checkAdminRole | Likely legacy | AdminGuard component handles this | Uncertain | — |
| functions/complianceDocumentService | Possible legacy | ComplianceDocument entity vs ComplianceRecord | Uncertain | Check if ComplianceDocument has any records |
| functions/utils/publishSafety | Conflicts with comment | Code comment says "shared helpers not reliable" yet file exists | Uncertain | Check if actually imported by publishVideoToWebsite |
| functions/shared/aiVideoTextPrompt | Unusual pattern | Base44 typically doesn't support shared function imports | Uncertain | Check if functions actually import it |
| functions/shared/assetValidation | Unusual pattern | Same issue | Uncertain | — |
| components/performer/tabs/VideosTab | Phase 1 stub | File literally says "Phase 1 shell" — not implemented | No, not yet | Wait for implementation |
| PublishingDebugPanel | Debug panel | Should not be in production | Uncertain | Confirm not needed |
| components/performerDashboard/EarningsTab | Likely replaced | OverviewTab renders EarningsBreakdownTable instead; this tab is NOT in PerformerDashboardTabs | **YES** — not rendered | Verify it's not imported anywhere |
| Dashboard V1 Migration Status | Hardcoded | "Pending" for all migration items — V2 is live | Low priority | Confirm V1 migration complete |
| PerformerSession records (expired) | Data accumulation | Sessions older than expires_at never cleaned up | Data only | — |
| GeoAvailability, GeoPolicy, GeoRule, GeoAudit entities | Unused | No page references them | Uncertain | Check entity record counts |
| FanclubContent entity | Unused | No page references it | Uncertain | Check record counts |
| PerformerStat entity | Possible unused | No page references it | Uncertain | Check record counts |
| PageView, VideoView entities | Low usage | No page references them for display | Uncertain | — |
| NotificationLog entity | Appears unused | No page references it | Uncertain | — |

---

## SECTION 8 — FULL AUTH / PERMISSION MATRIX

| Route / Function | Public | Admin | Performer (session) | Performer (user_id) | Internal | Cross-performer Risk | Notes |
|-----------------|--------|-------|---------------------|---------------------|----------|---------------------|-------|
| / (Home) | ✅ | — | — | — | — | No | Safe |
| /videos, /videos/:slug | ✅ | — | — | — | — | No | Source video URL never exposed publicly |
| /performers, /performers/:slug | ✅ | — | — | — | — | No | **BUG**: Exposes date_of_birth in getPublicPerformers response |
| /fanclub | ✅ | — | — | — | — | No | — |
| /performer/login | ✅ | — | — | — | — | No | — |
| /performer/dashboard | — | — | ✅ (token) | — | — | **YES** | Session token validated server-side per-request but NOT cross-checked with other performers |
| /admin/* | — | ✅ | — | — | — | No | AdminGuard + ProtectedRoute |
| performerDashboardService | — | — | ✅ (session token) | — | — | Low | performer_id in body verified against session |
| performerSupportService:create_request | — | — | — | ✅ | — | **YES** | Only works if Performer.user_id matches Base44 user. The_Fitmaster has user_id: null — **will 403** |
| performerSupportService:admin_* | — | ✅ | — | — | — | No | — |
| SupportTab (performer portal) | — | — | ✅ (UI renders) | ✅ (actual API call) | — | **YES** | The SupportTab renders for performer-session users but the underlying API requires Base44 user auth with linked user_id |
| performerLogin | ✅ | — | — | — | — | No | Public endpoint, returns session token |
| getPublicVideos | ✅ | — | — | — | — | No | source_video_url excluded |
| getPublicVideoDetail | ✅ | — | — | — | — | No | **Technically unused** — VideoDetail page uses entity SDK directly, potentially exposing more fields |
| getPublicPerformers | ✅ | — | — | — | — | **MINOR** | `date_of_birth` included in sanitized response — should be removed |
| updateVideoProcessingResult | — | — | — | — | ✅ (processor key) | No | External processor callback |
| paymentWebhook | — | — | — | — | ✅ (IPN signature) | No | — |
| contractService:get_for_signing | ✅ | — | — | — | — | Low | Token-gated, expires |
| contractService:submit_signature | ✅ | — | — | — | — | Low | Token-gated |
| contractService:create_from_application | — | ✅ | — | — | — | No | — |
| performerComplianceService | — | ✅ | — | — | — | No | Admin only |
| createPerformerPayoutRequest | — | — | — | ✅ | — | **YES** | Requires user_id. FAILS for performers without linked account |
| getPerformerProfilePrivate | — | — | — | ✅ | — | **YES** | Same issue |
| getPerformerPayoutRequests | — | — | — | ✅ | — | **YES** | Same issue |
| identityVerificationService | — | — | — | ✅ | — | **YES** | Same issue |
| DashboardHeader (component) | — | — | — | ✅ | — | **YES** | Calls getPerformerProfilePrivate via Base44 auth — FAILS if user_id null |
| ProfileAndPayoutTab | — | — | — | ✅ | — | **YES** | Same issue |
| PerformerRouteHandler | Mixed | — | ✅ (token) | ✅ (role) | — | No | Accepts either auth system |

---

## SECTION 9 — FULL DATA FLOW MAPS

### Flow 1: Public Video Display
```
User visits /videos/:slug
→ VideoDetail.jsx
→ base44.entities.Video.filter({status:'published'}) — fetches ALL published videos (no limit!)
→ base44.entities.VideoPerformer.list() — fetches ALL VideoPerformer records
→ Filter client-side by slug + publish readiness check
→ If not found → 404
→ If found → render player (trailer_url iframe), performer sidebar, related videos
→ "Watch Full Video" button → getVideoPlaybackUrl (requires Base44 auth)

PROBLEM: The getPublicVideoDetail function exists but is NOT called here — entity SDK is used directly.
This means: (1) source_video_url could potentially be exposed if safeVideo filter missed something,
(2) Full video/performer lists fetched on every page load.
```

### Flow 2: Admin Video Upload/Edit
```
Admin → /admin/video-upload → VideoUploadPanel
→ createR2UploadUrl {title, file_name...} → creates Video(draft) + VideoAsset(pending) → returns signed PUT URL
→ Browser PUT to R2
→ finalizeUploadedVideo {asset_id, video_id} → verifies R2 file → creates JobQueue → triggers external processor
→ External processor processes video
→ updateVideoProcessingResult callback → writes URLs to Video entity, updates JobQueue
→ Admin can then go to /admin/videos/:id (VideoEdit)
→ VideoEdit shows status, allows metadata editing, publish
```

### Flow 3: Performer Portal Overview
```
Performer logs in via /performer/login → performerLogin → returns {token, performer}
→ Stored in localStorage: performer_session_token, performer_data
→ PerformerRouteHandler allows /performer/dashboard
→ PerformerDashboard.jsx loads:
  → performerDashboardService:get_dashboard_summary (auth: session token)
  → performerDashboardService:get_career_statistics (auth: session token)
  → DashboardHeader.jsx loads getPerformerProfilePrivate (auth: Base44 user auth — FAILS if no user_id)
→ OverviewTab:
  → performerDashboardService:get_earnings for currentMonth
  → Renders MonthlyCloseoutCard, EarningsBreakdownTable, ActionRequiredCard, etc.
```

### Flow 4: Performer Earnings / Monthly Closeout
```
ADMIN SIDE (PerformerEarning path — old):
Admin → /admin/monthly-closeout
→ monthlyCloseoutService:get_closeout_preview
  → reads VideoStatSnapshot for period
  → calculates per-performer earnings (default 70% split — WRONG for most performers)
→ monthlyCloseoutService:generate_draft_earnings
  → creates PerformerEarning records

ADMIN SIDE (PerformerEarningLineItem path — new):
Admin → /admin/earnings
→ performerEarningLineItemService:get_line_items
→ Add/edit/delete PerformerEarningLineItem records
→ performerEarningLineItemService:create_monthly_closeout
  → reads VideoStatSnapshot → creates PerformerEarningLineItem records
  → status: 'estimated' (NOT 'pending')

PERFORMER SIDE:
PerformerDashboard → OverviewTab
→ performerDashboardService:get_earnings
  → reads PerformerEarning (legacy) + PerformerEarningLineItem (new) + VideoStatSnapshot (estimated)
  → COMBINES all three into unified earnings list
  → Deduplicates VideoStatSnapshot vs existing manual earnings

RESULT: The_Fitmaster 2026-06:
  - 1 PerformerEarning (livestream, $77.65 gross, $31.06 net, pending)
  - 0 PerformerEarningLineItem records
  - 2 VideoStatSnapshot records (xHamster: $4.03 + $0.06)
  → performerDashboardService combines them: $81.74 gross, $32.70 performer, $49.04 studio
  → But NOTE: third VideoStatSnapshot ($0.78, video_id=6a22ae6fc793e2843243f212) is NOT linked to The_Fitmaster via VideoPerformer — correct exclusion
```

### Flow 5: KYC/Compliance/Contracts
```
ADMIN:
PerformerDetailWrapper → ComplianceTab (admin) → KycSection
→ KycSection: performerAdminService:set_kyc_status
  → updates Performer.kyc_status
  → triggers performerComplianceService:lock_evaluation if not approved
  → performerComplianceService checks: KYC + valid signed contract + valid medical record
  → The_Fitmaster: KYC approved ✓, has Contract (status:signed, verified:true, expires_at:null) ✓
    BUT: no medical_test or std_test ComplianceRecord — compliance check FAILS medical gate
    → However: compliance_override: true, compliance_locked: false → override active

PERFORMER PORTAL:
ComplianceTab (performer, in PerformerDashboardTabs) → performerDashboardService:get_compliance
  → returns {contracts, compliance_records, kyc_status, account_status, compliance_locked}
  → ComplianceTab does NOT call performerComplianceService — just displays raw data
  → KYC shows: 'approved' ✓
  → Contracts: 1 contract (performer type, status:signed, verified:true, signed_at:null)
  → PROBLEM: signed_at is null on The_Fitmaster's contract — the download button requires status === 'signed' which it is, so download should work
```

### Flow 6: Guest Production Application
```
Public: /become-performer or /guest-production → Apply button
→ Requires auth → /register or /login
→ GuestProduction page has Apply button
→ BecomePerformer page has application form
→ submitPerformerApplication → creates GuestProductionApplication

Admin: /admin/applications
→ Review application
→ Upload/review media via signed R2 URLs (getApplicationFileSignedUrl)
→ Approve → handleCreatePerformer → creates Performer record, updates admin_notes with performer ID
→ Complete contract data form → contractService:create_from_application
  → renders template with performer data
  → uploads HTML snapshot to R2
  → generates signing URL
→ Admin sends signing URL to performer
→ Performer: /sign-contract?token=...
  → contractService:get_for_signing → fetches rendered HTML from R2
  → Performer types signature → contractService:submit_signature → sets status:signed

FRAGILE: performer_id stored as text in admin_notes field (regex extract)
```

---

## SECTION 10 — BUG / INCONSISTENCY FINDINGS

### CRITICAL BUGS

| # | Area | Issue | Evidence | Affected Files | User Impact | Fix Direction |
|---|------|-------|----------|----------------|-------------|---------------|
| C1 | Performer Portal Auth | SupportTab, ProfileAndPayoutTab, DashboardHeader, getPerformerProfilePrivate all require Base44 user_id on Performer record. The_Fitmaster has user_id: null | `Performer.user_id: null` in DB. performerSupportService:create_request does `Performer.filter({user_id})` → returns empty → 403 | SupportTab, DashboardHeader, ProfileAndPayoutTab, performerSupportService, getPerformerProfilePrivate | Support tab crashes. Dashboard header may fail to load profile. Profile & payout tab fails. | Link user_id on Performer, OR change these services to accept session token auth |
| C2 | Performer Portal Token | PerformerDashboardTabs reads performerToken from localStorage on every render but does not update if token changes | `PerformerDashboardTabs:16 — const performerToken = localStorage.getItem(...)` | PerformerDashboardTabs | Token refresh breaks without page reload | Use useState + useEffect to read once |
| C3 | PlatformStatsTab | Uses `<option>` tags inside Radix `<SelectContent>` — options will not render correctly | `PlatformStatsTab.jsx:60` | PlatformStatsTab | Month filter dropdown is broken / empty | Replace `<option>` with `<SelectItem>` |
| C4 | VideoDetail | Fetches ALL published videos client-side and filters by slug — no limit parameter | `VideoDetail.jsx:54 — Video.filter({status:'published'}, '-release_date', 100)` — only 100 limit BUT ALSO list() with no limit | VideoDetail | Performance issue, possible incomplete results | Use getPublicVideoDetail function instead |
| C5 | PerformerDetail | Calls base44.entities.Video.list() with NO filter — fetches ALL videos including drafts | `PerformerDetail.jsx:55 — base44.entities.Video.list()` | PerformerDetail | Drafts/unpublished videos potentially visible | Filter by {status:'published'} |
| C6 | monthlyCloseoutService default revenue split | Default performer share is 70% in monthlyCloseoutService and performerEarningLineItemService:create_monthly_closeout. The_Fitmaster is 40% | `monthlyCloseoutService:87 — const splitPct = performer.revenue_split_pct \|\| 70` | monthlyCloseoutService | Wrong earnings generated for managed performers | Default should read from Performer.revenue_split_pct (which is correctly set to 40 for The_Fitmaster) — this IS the case, the fallback 70 would only apply if revenue_split_pct is 0/null |

### HIGH PRIORITY BUGS

| # | Area | Issue | Evidence | Affected Files | Impact |
|---|------|-------|----------|----------------|--------|
| H1 | VideoEdit German text | Delete confirm dialog and button labels are in German | VideoEdit.jsx:85 `'Video löschen?'`, VideoRow:88 `title="Löschen"` | VideoEdit, Videos admin | Inconsistent UX for international admin |
| H2 | EarningsTab (performer portal) | Uses `earning.earning_type` (legacy PerformerEarning field) instead of `earning.source_type` (new field) | EarningsTab.jsx:80 — `earning.earning_type.replace(/_/g," ")` | EarningsTab (performerDashboard) | Earnings tab crashes for new-style line items (undefined.replace) |
| H3 | Admin Earnings page default split | New line item modal defaults to 70% performer share | Earnings.jsx:26 `performer_share_percent: 70` | Earnings (admin) | Wrong default for managed performers |
| H4 | ComplianceTab (performer) missing token | ComplianceTab queries performerDashboardService:get_compliance but does NOT pass performerToken | ComplianceTab.jsx:13 — action:"get_compliance", no performer_token | ComplianceTab (performerDashboard) | Will 401 for performer session users |
| H5 | Contract signed_at null | The_Fitmaster's contract has status:'signed' but signed_at: null | DB record `Contract:6a1ddfd5...` | performerDashboardService:get_compliance | ContractSection download only enabled for status==='signed' so download works, but audit/compliance checks that read signed_at will fail |
| H6 | publishVideoToWebsite vs validatePublishSafety drift | Both have identical validation logic with comment "must stay identical" — no enforcement | Both functions | Content pipeline | Silent drift if one is updated |
| H7 | getPublicVideoDetail unused | VideoDetail page does NOT call getPublicVideoDetail — uses entity SDK directly, bypassing safety filters | VideoDetail.jsx:53-55 | VideoDetail, getPublicVideoDetail | Admin fields could be exposed if entity schema changes; backend sanitization bypassed |
| H8 | PerformerDetail exposes draft videos | base44.entities.Video.list() returns all videos with no status filter | PerformerDetail.jsx:55 | PerformerDetail | Draft/unpublished videos shown on public performer pages |
| H9 | date_of_birth in public performers API | getPublicPerformers includes date_of_birth in sanitized output | getPublicPerformers.js:52 | getPublicPerformers | PII exposed publicly |

### MEDIUM PRIORITY BUGS

| # | Area | Issue |
|---|------|-------|
| M1 | EarningsBreakdownTable | Date column shows "N/A" for unpaid entries — uses paid_at fallback to period_month but paid_at is always null for pending |
| M2 | DetailedVideoCard | compliance_status is hardcoded as "compliant" regardless of actual compliance |
| M3 | DashboardHeader double-fetch | Calls getPerformerProfilePrivate AND gets performer from performerDashboardService — duplicated data fetch |
| M4 | PerformerSessions accumulate | Expired sessions never deleted — PerformerSession table will grow indefinitely |
| M5 | searchPerformers totalCount wrong | When search filter applied, totalCount estimate formula is incorrect |
| M6 | AdminGuard vs checkAdminRole | AdminGuard component handles admin access; checkAdminRole function also exists — redundancy |
| M7 | PublishingDebugPanel | Should not be visible in production builds |
| M8 | ContentReview filter | Only shows videos with status='draft' AND processing_status='draft_ready' — leaves out 'published'→'republish' scenarios |
| M9 | PerformerDetail fetches all VideoPerformer | base44.entities.VideoPerformer.list() with no filter — performance issue at scale |

### LOW PRIORITY

| # | Area | Issue |
|---|------|-------|
| L1 | Status color maps | Duplicated in every component — no shared utility |
| L2 | V1 migration dashboard | Hardcoded "Pending" for all items |
| L3 | SupportTab email | support@fleshlab.com hardcoded (may be wrong address) |
| L4 | Fanclub pricing | $12.99 referenced in PerformerDetail, $9.99 in Fanclub page — inconsistent |
| L5 | "Compliance Clear" header badge | Shows based on compliance_locked=false, but the_Fitmaster has no medical record — may give false assurance |

---

## SECTION 11 — CONSOLIDATION PLAN

### A) Functions to Merge

| From | Into | Action |
|------|------|--------|
| performerFinanceService (list_earnings_for_period) | performerEarningLineItemService | Merge and standardize |
| performerVideoStatsService:create_snapshot | videoStatsImportService:create_snapshot | Merge into one |
| getUploadUrl, createDocumentUploadUrl, getComplianceUploadUrl | createAdminFileUploadUrl | Use centralized version |
| validatePublishSafety + publishVideoToWebsite validation | utils/publishSafety | Actually use the shared module |
| quickAssetValidation, validateVideoAssetAccessibility, validateAndFixVideoAssets | validateAndRepairVideoAssets | Consolidate to one |
| analyzeVideoDuplicates, findDuplicateVideos | One function | — |
| autoPublishVideo | publishVideoToWebsite | Investigate and merge |
| simulateProcessorCallback, diagnoseCallbackPath, diagnoseVideoAssets, testVideoUrls | (Remove after confirming unused) | — |

### B) Services to Split/Merge

| Service | Recommendation |
|---------|---------------|
| performerDashboardService (1000+ lines) | Split into: performerAuthService (session validation), performerEarningsReader (earnings), performerComplianceReader (compliance), performerVideosReader (videos) |
| monthlyCloseoutService | Should write to PerformerEarningLineItem instead of PerformerEarning |
| performerEarningLineItemService + performerFinanceService | Merge into one canonical earnings service |
| complianceDocumentService | Investigate if ComplianceDocument entity is actually used — possibly remove |

### C) Entities — Source of Truth Recommendations

| Conflict | Recommendation |
|----------|---------------|
| PerformerEarning vs PerformerEarningLineItem | PerformerEarningLineItem is canonical. Migrate all earnings to it. |
| Video.primary_thumbnail_url vs VideoAsset.cdn_url (thumbnail) | VideoAsset is canonical for asset tracking; Video fields are denormalized cache |
| Video.meta_title vs SEOPage.meta_title | Video is canonical; SEOPage should read from Video |
| Contract.signed_at vs performer_signed_at | Use performer_signed_at as canonical, copy to signed_at on completion |
| Performer.kyc_status | Canonical — all compliance checks must use this field |
| ComplianceRecord vs ComplianceDocument | ComplianceRecord is canonical |

### D) Shared Helpers to Create

| Helper | Purpose | Files that Need It |
|--------|---------|-------------------|
| lib/statusUtils.js | Status → color/label maps | All performer and admin components |
| lib/earningsUtils.js | Common earnings calculation (gross/performer/studio split) | performerDashboardService, monthlyCloseoutService |
| lib/complianceUtils.js | Compliance status resolution | All compliance display components |

### E) Things to Remove Later (Not Now)

| Item | Why Not Now |
|------|-------------|
| performerFinanceService | AdminPerformerEarningsTab still uses it |
| monthlyCloseoutService PerformerEarning writes | Existing data in PerformerEarning entity |
| Custom performer auth system (performerLogin/PerformerSession) | Active sessions in production |
| getUploadUrl, createDocumentUploadUrl, getComplianceUploadUrl | Still referenced in compliance components |
| Diagnostic functions (simulate, diagnose, test*) | Need to verify zero usage |
| ComplianceDocument entity + complianceDocumentService | Need to verify zero records |
| EarningsTab component in performerDashboard | Need to confirm not rendered anywhere |
| VideosTab (admin) stub | Need to implement before removing placeholder |

---

## SECTION 12 — DO NOT TOUCH YET

| Item | Reason |
|------|--------|
| `functions/performerLogin` + `PerformerSession` entity | Active performers are logged in with this system |
| `functions/monthlyCloseoutService` | Used by admin for monthly earnings generation; migration to line item system needed first |
| `functions/performerFinanceService` | Used by admin EarningsTab in performer detail |
| `entities/PerformerEarning.json` | Contains live earnings data including The_Fitmaster's livecam $77.65 |
| `functions/migrateLegacyR2Urls` | Destructive migration — must not run unless explicitly confirmed |
| `functions/deleteUnassignedVideos` | Destructive — must not run unless explicitly confirmed |
| `functions/cleanupDuplicateVideos`, `deleteDuplicateVideos` | Destructive operations |
| `components/performer/tabs/VideosTab` (stub) | Placeholder — needs implementation not deletion |
| `utils/publishSafety` | May actually be imported — verify before removing |
| `shared/aiVideoTextPrompt`, `shared/assetValidation` | May be imported — verify before removing |
| `entities/ComplianceDocument.json` | May have records — verify count before removing |
| `functions/autoPublishVideo` | May be used by a scheduled automation — check before removing |
| `functions/checkStuckProcessingJobs`, `markOldJobsAsTimeout` | Should be scheduled automations — check automation list |
| `pages/admin/ComingSoon` (used for /admin/news, /admin/seo, /admin/migration) | These routes are referenced in admin nav — do not remove placeholder |
| `GeoAvailability`, `GeoPolicy`, `GeoRule`, `GeoAudit` entities | May contain configuration data even if no UI built |

---

## THE_FITMASTER VERIFIED DATA (Section I)

| Item | Expected | Actual (from DB) | Match? |
|------|----------|-----------------|--------|
| Videos linked | 3 | 3 (VideoPerformer records: 6a231ea2, 6a230b20, 6a1d2231) | ✅ |
| Published videos | 3 | 2 explicitly published, 1 in DB with published status | ⚠️ (3rd video 6a1ca659 status not confirmed in query result) |
| KYC status | approved | approved | ✅ |
| Revenue split | 40% | revenue_split_pct: 40 | ✅ |
| Video platform stats (2026-06) | 2 rows ($4.09 total) | 2 rows: $4.03 + $0.06 = $4.09 | ✅ |
| Livecam/manual earnings (2026-06) | $77.65 gross, $31.06 net | PerformerEarning: gross $77.65, net $31.06, status:pending | ✅ |
| Combined gross | $81.74 | $4.09 + $77.65 = $81.74 | ✅ |
| Performer total | $32.70 | $1.64 (40% of $4.09) + $31.06 = $32.70 | ✅ |
| Studio share | $49.04 | $81.74 - $32.70 = $49.04 | ✅ |
| Earnings breakdown rows | 3 (2 video, 1 livecam) | 2 VideoStatSnapshot + 1 PerformerEarning = 3 | ✅ |
| Contracts | 1 | 1 Contract (performer type, signed, verified, signed_at=null) | ✅ (with caveat: signed_at is null) |
| Compliance records | 3 | 3 records (id front, id back, selfie) | ✅ |
| ComplianceRecord types | id-related | All are 'id' and 'other' — NO medical/std_test | ⚠️ Compliance check will FAIL medical gate |
| user_id | Should be linked for full portal access | null | ❌ Most performer portal features requiring Base44 auth WILL FAIL |
| SupportTab | Should work | Will 403 (no user_id) | ❌ |
| DashboardHeader | Should load profile | Will fail getPerformerProfilePrivate (no user_id) | ❌ |
| compliance_override | Active | compliance_override: true, reason: "all informations available" | ✅ (manually overridden) |
| compliance_locked | false | false | ✅ |

---

*End of FLESHLAB V2 Full Audit Report — 2026-06-06*
*Audit scope: read-only. No code was changed. No data was modified.*