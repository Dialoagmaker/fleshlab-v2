# LoyalFans compatibility patch release

## Identity and scope

Base: `9eea2d7e55501c4dfd7606ef905cdc1d9daf4ea9` (currently deployed release).
Patch identity: resolve `git rev-parse HEAD` in this committed release. The detached
`LOYALFANS_COMPATIBILITY_PATCH_MANIFEST.md` records the resulting SHA, archive hash and image IDs.
The patch was prepared in an isolated release worktree based on the deployed commit, preserving
unrelated uncommitted development work. No architecture, storage runtime, fulfillment policy,
provider defaults, production configuration or migrations change.

## Corrections

- Shared UTC ISO millisecond timestamp normalization accepts existing zoned ISO strings and observed
  `{date, timezone_type, timezone}` objects. Required malformed evidence fails closed. Optional missing
  timestamps remain null; named zones and numeric offsets are respected without host-timezone inference.
- Initial normal comments POST accepts absent/null top-level continuation markers. Any non-null marker
  returns continuation-contract-required without consuming a challenge or binding the buyer.
- Challenge verification matches the exact generated token within ordinary surrounding text. Unicode
  token boundaries reject prefix/suffix/partial spoofing. Exact parent post and buyer UIDs, challenge
  expiry and single-use transaction protections remain in force.

## Validation

- Complete isolated release server suite: 586 passed, 0 failed; the gated PostgreSQL test skipped in
  this unit run and executed separately.
- Current-worktree targeted provider/catalogue/buyer-link/commerce/media regressions: 374 passed,
  0 failed; the same gated PostgreSQL test skipped.
- Isolated actual PostgreSQL integration using the newly built API image (ffprobe installed):
  19 passed, 0 failed. The separate real-Azure test is intentionally skipped, as that integration was
  already confirmed READY and is not rerun by this patch. Local private-storage tests use Azurite.
- The new database-backed buyer test verifies observed object `added_at`, omitted markers and
  surrounding challenge text; concurrent verification consumes one challenge with no new grant/job.
- A neutral 116-record fixture reconstructs observed timestamp wire shapes and dynamic 36/4 traversal:
  0 metadata conflicts, 0 failures, 0 storage fetches, 0 database writes. No raw live catalogue content
  is read, copied or archived for this patch; a production dry-run rerun remains post-deployment work.
- API and Web Docker builds pass (all public/admin/performer/earn bundles included). Worker uses the
  same API image. Changed-file ESLint: 12 JavaScript files, 0 new or existing issues under the server
  recommended-rule gate. `git diff --check` passes.

## Deployment prerequisites and sequence (not executed)

1. Separately authorize patch deployment. Verify exact archive SHA against the detached manifest.
2. Record previous symlink, immutable API/worker/Web image IDs and Compose configuration labels.
   Preserve existing protected API `.env`, secret mounts and all false provider/media/catalogue switches.
3. Stage/build the immutable release through the established production mechanism. Recreate only
   separately approved application services, then verify image IDs, release path, health and disabled state.
4. No migration is required. Existing applied 0059–0062 remain in place; no migration runner is needed.
5. Separately authorize read-only catalogue traversal/dry-run and terminal first-page buyer proof probes.
   No ingestion, publication, purchase, link writes or entitlements are authorized by this patch preparation.

## Rollback and known limitations

Restore recorded previous release symlink AND previous Compose/image identities; a symlink alone does
not change containers. Retain previous protected configuration and secret paths. No database rollback
is necessary or introduced. Do not prune the deployed-release rollback images.

Multi-page comments remain NOT READY until continuation semantics are observed. Unsupported timezone
abbreviations and ambiguous/nonexistent local DST timestamps fail closed. Customer onboarding requires
a fresh challenge. Currency and internal POSTED policy remain explicit configuration; no upstream status
is invented. Unresolved reversal linkage remains manual review. The provider and media runtime remain
disabled; this patch performs no production deployment or upstream request.
