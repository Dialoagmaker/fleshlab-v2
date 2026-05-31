/**
 * pullV1MigrationData
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only V2 migration orchestrator.
 * Pulls export data from V1 export functions via API, then pipes each dataset
 * into the corresponding V2 import function.
 *
 * Import order: Brands → Performers → Videos → News
 *
 * Defaults to dry_run. Real import requires explicit confirmation:
 * { "execute": true, "dry_run": false, "confirm": "IMPORT_V1_TO_V2" }
 *
 * Environment variables required (set via secrets):
 *   V1_API_BASE_URL   — V1 app base URL, no trailing slash
 *   V1_AUTH_TOKEN     — V1 admin API token
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAGES = [
  {
    name:         'brands',
    v1Function:   'exportBrandsForV2',
    v2Function:   'importBrandsFromV1',
    payloadKey:   'brands',
  },
  {
    name:         'performers',
    v1Function:   'exportPerformersForV2',
    v2Function:   'importPerformersFromV1',
    payloadKey:   'performers',
  },
  {
    name:         'videos',
    v1Function:   'exportVideosForV2',
    v2Function:   'importVideosFromV1',
    payloadKey:   'videos',
  },
  {
    name:         'news',
    v1Function:   'exportNewsForV2',
    v2Function:   'importNewsFromV1',
    payloadKey:   'articles',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // ── Config ────────────────────────────────────────────────────────────────
    const V1_BASE = Deno.env.get('V1_API_BASE_URL');
    const V1_TOKEN = Deno.env.get('V1_AUTH_TOKEN');

    if (!V1_BASE || !V1_TOKEN) {
      return Response.json({
        error: 'Missing required secrets: V1_API_BASE_URL and/or V1_AUTH_TOKEN. Set them via the dashboard.',
      }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const dry_run = body.dry_run !== false;        // default true
    const execute = body.execute === true;          // default false
    const confirm = body.confirm;

    // ── Real import guard ─────────────────────────────────────────────────────
    if (!dry_run && execute && confirm !== 'IMPORT_V1_TO_V2') {
      return Response.json({
        error: 'Real import requires: { "execute": true, "dry_run": false, "confirm": "IMPORT_V1_TO_V2" }',
      }, { status: 400 });
    }

    // Safety: if execute not set but dry_run=false somehow, force dry_run back on
    const effectiveDryRun = !(execute && !dry_run && confirm === 'IMPORT_V1_TO_V2');

    const report = {
      mode: effectiveDryRun ? 'DRY RUN' : '⚠️  LIVE IMPORT',
      dry_run: effectiveDryRun,
      stages: {},
      aborted_at: null,
      success: false,
    };

    // ── Stage runner ──────────────────────────────────────────────────────────
    for (const stage of STAGES) {
      const stageReport = {
        v1_function: stage.v1Function,
        v2_function: stage.v2Function,
        exported_count: 0,
        v1_reachable: false,
        imported_created: 0,
        imported_updated: 0,
        imported_skipped: 0,
        errors: [],
        warnings: [],
      };

      // ── 1. Pull from V1 ───────────────────────────────────────────────────
      let v1Data = null;
      try {
        const v1Url = `${V1_BASE}/api/functions/${stage.v1Function}`;
        const v1Res = await fetch(v1Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_key': V1_TOKEN,           // never logged
          },
          body: JSON.stringify({}),
        });

        if (!v1Res.ok) {
          const errText = await v1Res.text();
          stageReport.errors.push(`V1 ${stage.v1Function} returned HTTP ${v1Res.status}`);
          stageReport.errors.push(`V1 response: ${errText.substring(0, 200)}`);
          report.stages[stage.name] = stageReport;
          report.aborted_at = stage.name;
          return Response.json(report, { status: 200 });
        }

        const v1Json = await v1Res.json();

        // V1 export functions return: { data: { data: [...] } } or { data: [...] }
        v1Data = v1Json?.data?.data ?? v1Json?.data ?? null;

        if (!Array.isArray(v1Data)) {
          stageReport.errors.push(`V1 ${stage.v1Function} did not return an array. Got: ${JSON.stringify(v1Json).substring(0, 200)}`);
          report.stages[stage.name] = stageReport;
          report.aborted_at = stage.name;
          return Response.json(report, { status: 200 });
        }

        stageReport.v1_reachable = true;
        stageReport.exported_count = v1Data.length;

      } catch (fetchErr) {
        stageReport.errors.push(`Network error calling V1 ${stage.v1Function}: ${fetchErr.message}`);
        report.stages[stage.name] = stageReport;
        report.aborted_at = stage.name;
        return Response.json(report, { status: 200 });
      }

      // ── 2. Pipe into V2 import function ───────────────────────────────────
      try {
        const v2Payload = {
          dry_run: effectiveDryRun,
          [stage.payloadKey]: v1Data,
        };

        const v2Result = await base44.asServiceRole.functions.invoke(stage.v2Function, v2Payload);

        stageReport.imported_created = v2Result?.created ?? 0;
        stageReport.imported_updated = v2Result?.updated ?? 0;
        stageReport.imported_skipped = v2Result?.skipped ?? 0;
        stageReport.warnings = v2Result?.warnings ?? [];

        const v2Errors = v2Result?.errors ?? [];
        if (v2Errors.length > 0) {
          stageReport.errors.push(...v2Errors.map(e =>
            `[${e.v1_id ?? '?'}] ${e.name ?? e.title ?? e.stage_name ?? ''}: ${(e.errors ?? []).join('; ')}`
          ));
          report.stages[stage.name] = stageReport;
          report.aborted_at = stage.name;
          return Response.json(report, { status: 200 });
        }

      } catch (importErr) {
        stageReport.errors.push(`V2 import function ${stage.v2Function} threw: ${importErr.message}`);
        report.stages[stage.name] = stageReport;
        report.aborted_at = stage.name;
        return Response.json(report, { status: 200 });
      }

      report.stages[stage.name] = stageReport;
    }

    report.success = true;
    return Response.json(report);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});