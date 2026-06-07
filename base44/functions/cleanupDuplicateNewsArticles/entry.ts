import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Safe NewsArticle cleanup - Phase 1: Consolidate duplicates
// This function:
// 1. Updates canonical article with new content + legacy_slugs
// 2. Moves duplicate articles to draft status
// DO NOT hard-delete any articles

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      canonicalArticleId, 
      newTitle, 
      newSlug, 
      newMetaTitle, 
      newMetaDescription,
      newExcerpt,
      newContent,
      duplicateArticleIds,
      duplicateSlugs
    } = body;

    if (!canonicalArticleId || !newSlug || !duplicateArticleIds) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Step 1: Update canonical article
    const canonicalUpdate = {
      title: newTitle,
      slug: newSlug,
      meta_title: newMetaTitle,
      meta_description: newMetaDescription,
      excerpt: newExcerpt,
      content: newContent,
      legacy_slugs: duplicateSlugs || [],  // Add all old slugs to legacy_slugs
      status: 'published'
    };

    await base44.asServiceRole.entities.NewsArticle.update(canonicalArticleId, canonicalUpdate);

    // Step 2: Move duplicate articles to draft (DO NOT DELETE)
    for (const dupId of duplicateArticleIds) {
      await base44.asServiceRole.entities.NewsArticle.update(dupId, {
        status: 'draft'
      });
    }

    return Response.json({
      success: true,
      message: `Canonical article updated, ${duplicateArticleIds.length} duplicates moved to draft`,
      canonicalArticleId,
      newSlug,
      legacySlugsCount: duplicateSlugs?.length || 0,
      draftsCount: duplicateArticleIds.length
    });

  } catch (error) {
    console.error('cleanupDuplicateNewsArticles error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});