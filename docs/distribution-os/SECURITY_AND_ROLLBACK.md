# Security, Deployment Gate, and Rollback

## Security controls in this release

- `distributionOSService` accepts POST only, requires an authenticated administrator, caps request bodies at 1 MB, and returns `Cache-Control: no-store`.
- There are no platform credentials, cookies, passwords, payment credentials, API tokens, or media upload requests in the new workflow.
- Application drafts are non-binding and are not submitted externally.
- Rights evidence responses omit compliance-document file URLs and identity/selfie contents. Approval requires a human operator to attest to checking the restricted source records.
- Publication recording requires operator confirmation, a verified platform approval record, a valid HTTPS URL on the configured official platform domain, a unique external ID, and a fresh readiness check.
- Revenue imports are size-limited, hashed, deduplicated, and labeled as platform-reported or estimated. The raw CSV is omitted from list responses.
- Administrative state changes create AuditLog entries. Logs contain IDs and status summaries, not uploaded documents or credentials.

## Deployment gate

This branch has not passed a production deployment gate. The execution environment did not provide a Base44 production session, production credentials, Azure CLI, platform accounts, or a live database backup. Do not publish from this branch until an authorized operator completes all of the following in the target environment:

1. Confirm the exact Base44 app, environment, and branch to publish; verify separation from unrelated projects.
2. Review entity schemas and confirm access policies restrict all new records and the endpoint to administrators.
3. Back up the production database and confirm restore access. Capture the current deployed revision and record a rollback owner.
4. Deploy to a non-production environment first. Run admin/unauthenticated access checks, route smoke tests, rights denial tests, idempotency checks, CSV import tests, and a rollback drill with dummy data.
5. Confirm that existing uploads and compliance workflows remain available and that no external upload is triggered.
6. Recheck official platform terms, account authorization, acceptable use, and account-specific rights before any external distribution.
7. Approve production rollout with a documented maintenance window, rollback trigger, and post-deployment audit.

## Rollback procedure

1. Stop operator use of the Distribution page and disable the new route/function through the deployment configuration if a security or data-integrity issue is found.
2. Revert the deployed application to the last recorded known-good revision using the Base44 release controls. Do not delete new entity data as part of the first response.
3. Preserve audit logs, failed job/import records, and backup snapshots for investigation. Restrict access if any record exposure is suspected.
4. Restore entity data from the verified pre-deployment backup only if the incident is data corruption or schema incompatibility; validate existing compliance and upload workflows after restore.
5. Re-enable the route only after the defect is fixed and the deployment gate is repeated.

## Known implementation limits

- Entity operations do not use a verified cross-entity transaction or unique database constraint. Idempotency and CSV row deduplication are application-level checks; concurrent duplicate requests still require a production concurrency test.
- The source media pipeline does not yet populate the new SHA-256, audio-stream, and validation fields. Until that pipeline is implemented and verified, the readiness gate intentionally blocks existing assets.
- No backup, restoration, production security test, or end-to-end live platform test was performed in the coding environment.
