/**
 * adminPerformerImageMigrationDryRun
 * 
 * Read-only audit of all active performer profile images.
 * Reports which performers use unstable base44.app URLs vs stable R2/CDN URLs.
 * Does NOT update any DB records or upload any files.
 * 
 * Admin-only. Safe to run multiple times.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const R2_PUBLIC_BASE = Deno.env.get('R2_PUBLIC_BUCKET_URL') || '';

function getUrlDomain(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return 'invalid_url';
  }
}

function isBase44Url(url) {
  if (!url) return false;
  return url.includes('base44.app');
}

function isStableUrl(url) {
  if (!url) return false;
  const domain = getUrlDomain(url);
  return (
    domain?.includes('r2.dev') ||
    domain?.includes('cloudflare') ||
    domain?.includes('fleshlab.online') ||
    domain?.includes('pub-') // Cloudflare R2 public bucket pattern
  );
}

function getExtFromUrl(url) {
  if (!url) return 'jpg';
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1].toLowerCase().split('?')[0];
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) return ext;
    }
  } catch {
    // ignore
  }
  return 'jpg';
}

function getExtFromContentType(ct) {
  if (!ct) return null;
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  if (ct.includes('avif')) return 'avif';
  return null;
}

async function probeUrl(url) {
  try {
    // Use GET with Range header (first 512 bytes) — base44.app rejects HEAD requests
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Range': 'bytes=0-511',
        'User-Agent': 'FLESHLAB-SEO-Audit/1.0',
      },
      signal: AbortSignal.timeout(7000),
    });
    const ct = res.headers.get('content-type') || '';
    // Content-Range header gives us full file size: "bytes 0-511/193908"
    const contentRange = res.headers.get('content-range') || '';
    const fullSizeMatch = contentRange.match(/\/(\d+)$/);
    const fullSize = fullSizeMatch ? parseInt(fullSizeMatch[1]) : null;
    const reachable = res.ok || res.status === 206;
    return {
      reachable,
      status: res.status,
      content_type: ct,
      content_length_bytes: fullSize,
      ext_from_ct: getExtFromContentType(ct),
    };
  } catch (e) {
    return {
      reachable: false,
      status: null,
      content_type: null,
      content_length_bytes: null,
      ext_from_ct: null,
      error: e.message?.substring(0, 80),
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all active performers
    const performers = await base44.asServiceRole.entities.Performer.filter(
      { status: 'active' },
      '-updated_date',
      500
    );

    const results = [];
    let countBase44 = 0;
    let countStable = 0;
    let countNoImage = 0;
    let countSafeToMigrate = 0;
    let countSkipped = 0;

    // Probe all URLs in parallel (batched to avoid hammering)
    const BATCH_SIZE = 5;
    for (let i = 0; i < performers.length; i += BATCH_SIZE) {
      const batch = performers.slice(i, i + BATCH_SIZE);
      const probes = await Promise.all(batch.map(async (p) => {
        const url = p.profile_image_url || p.cover_image_url || null;
        const urlType = !url
          ? 'none'
          : isBase44Url(url)
          ? 'base44'
          : isStableUrl(url)
          ? 'stable_cdn'
          : 'other';

        let probe = null;
        if (url) {
          probe = await probeUrl(url);
        }

        // Determine best extension
        const extFromProbe = probe?.ext_from_ct;
        const extFromUrl = getExtFromUrl(url);
        const ext = extFromProbe || extFromUrl || 'jpg';
        const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;

        // Proposed R2 key — deterministic, slug-based
        const proposedKey = p.slug
          ? `performers/${p.slug}/profile.${normalizedExt}`
          : null;

        const proposedCdnUrl = R2_PUBLIC_BASE && proposedKey
          ? `${R2_PUBLIC_BASE.replace(/\/$/, '')}/${proposedKey}`
          : proposedKey
          ? `[R2_PUBLIC_BUCKET_URL]/${proposedKey}`
          : null;

        // Safety assessment
        let safeToMigrate = false;
        let migrationStatus = 'unknown';
        let warning = null;

        if (!url) {
          migrationStatus = 'no_image';
          warning = 'No profile_image_url or cover_image_url set';
        } else if (urlType === 'stable_cdn') {
          migrationStatus = 'already_stable';
          countStable++;
        } else if (urlType === 'base44') {
          countBase44++;
          if (!probe?.reachable) {
            migrationStatus = 'skipped_unreachable';
            warning = `Image not reachable (HTTP ${probe?.status || 'timeout'})`;
            countSkipped++;
          } else if (!probe?.content_type?.startsWith('image/')) {
            migrationStatus = 'skipped_not_image';
            warning = `Unexpected content-type: ${probe?.content_type}`;
            countSkipped++;
          } else {
            migrationStatus = 'ready_to_migrate';
            safeToMigrate = true;
            countSafeToMigrate++;
          }
        } else if (urlType === 'other') {
          migrationStatus = 'other_domain';
          warning = `Unknown domain: ${getUrlDomain(url)}`;
        } else {
          migrationStatus = 'no_image';
          countNoImage++;
        }

        if (!url) countNoImage++;

        return {
          performer_id: p.id,
          display_name: p.display_name,
          slug: p.slug,
          nationality: p.nationality || null,
          current_profile_image_url: url,
          current_domain: getUrlDomain(url),
          url_type: urlType,
          reachable: probe?.reachable ?? null,
          http_status: probe?.status ?? null,
          content_type: probe?.content_type ?? null,
          content_length_bytes: probe?.content_length_bytes ?? null,
          detected_ext: normalizedExt,
          proposed_r2_key: proposedKey,
          proposed_cdn_url: proposedCdnUrl,
          safe_to_migrate: safeToMigrate,
          migration_status: migrationStatus,
          warning: warning || null,
        };
      }));
      results.push(...probes);
    }

    // Sort: ready_to_migrate first, then others
    const ORDER = ['ready_to_migrate', 'already_stable', 'skipped_unreachable', 'skipped_not_image', 'other_domain', 'no_image'];
    results.sort((a, b) => ORDER.indexOf(a.migration_status) - ORDER.indexOf(b.migration_status));

    const summary = {
      total_active_performers: performers.length,
      count_base44_urls: countBase44,
      count_stable_cdn_urls: countStable,
      count_no_image: countNoImage,
      count_safe_to_migrate: countSafeToMigrate,
      count_skipped: countSkipped,
      r2_public_base_configured: !!R2_PUBLIC_BASE,
      dry_run: true,
      note: 'No DB records were updated. No files were uploaded. This is read-only.',
    };

    return Response.json({ summary, performers: results }, { status: 200 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});