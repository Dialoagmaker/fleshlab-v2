/**
 * migrateNewsArticleImages — Fix base44.app image URLs on published news articles
 *
 * Processes articles one at a time. Re-uploads base44.app file-proxy images to R2.
 * Call with {"slug": "article-slug"} to process a single article,
 * or {} to process all (batched internally, max 5 per call).
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE44_PATTERN = /^https:\/\/base44\.app\/api\/apps\/[a-f0-9]+\/files\//;
const BATCH_SIZE = 3;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = req.body ? await req.json().catch(() => ({})) : {};
    const targetSlug = body.slug || null;

    const articles = targetSlug
      ? await base44.asServiceRole.entities.NewsArticle.filter({ slug: targetSlug, status: 'published' })
      : await base44.asServiceRole.entities.NewsArticle.filter({ status: 'published' }, '-published_at', 200);

    const needsMigration = articles.filter(a => a.cover_image_url && BASE44_PATTERN.test(a.cover_image_url));
    const batch = needsMigration.slice(0, BATCH_SIZE);

    const results = { total_affected: needsMigration.length, processed_in_batch: batch.length, migrated: 0, skipped: 0, failed: 0, remaining: needsMigration.length - batch.length, details: [] };

    for (const article of batch) {
      try {
        const downloadResp = await fetch(article.cover_image_url);
        if (!downloadResp.ok) { results.failed++; results.details.push({ slug: article.slug, error: `Download failed: ${downloadResp.status}` }); continue; }

        const bytes = new Uint8Array(await downloadResp.arrayBuffer());
        const uploadResp = await base44.asServiceRole.integrations.Core.UploadFile({ file: bytes });

        if (!uploadResp.file_url) { results.failed++; results.details.push({ slug: article.slug, error: 'No file_url' }); continue; }

        await base44.asServiceRole.entities.NewsArticle.update(article.id, { cover_image_url: uploadResp.file_url });
        results.migrated++;
        results.details.push({ slug: article.slug, new_url: uploadResp.file_url.substring(0, 70) });
      } catch (err) {
        results.failed++;
        results.details.push({ slug: article.slug, error: err.message });
      }
    }

    if (results.remaining > 0) {
      results.message = `Batch complete. ${results.remaining} articles remaining. Call this function again to process the next batch.`;
    } else if (results.migrated > 0) {
      results.message = 'All base44.app image URLs have been migrated.';
    } else {
      results.message = 'No articles to migrate.';
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});