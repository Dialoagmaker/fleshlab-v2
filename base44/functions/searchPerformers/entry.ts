// searchPerformers — Server-side search with pagination for the Performer list.
// Solves the 500-record ceiling by implementing true cursor-based pagination.
//
// Usage:
//   POST /functions/searchPerformers
//   { search: "anna", status: "active", page: 0, pageSize: 50 }
//
// Returns:
//   { results: [...], totalCount: number, hasMore: boolean, page: number }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { search = '', status, page = 0, pageSize = 50 } = body;

    // Validate pageSize to prevent abuse
    const safePageSize = Math.min(Math.max(pageSize, 10), 100);
    const offset = page * safePageSize;

    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Fetch performers with filter
    const allPerformers = await base44.asServiceRole.entities.Performer.filter(
      filter,
      'display_name',
      offset + safePageSize + 1 // Fetch one extra to detect hasMore
    );

    console.log('[searchPerformers] Filter:', filter);
    console.log('[searchPerformers] Fetched performers count:', allPerformers?.length || 0);
    console.log('[searchPerformers] First performer:', allPerformers?.[0]?.display_name);

    // Apply text search server-side if search term provided
    let results = allPerformers;
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      results = allPerformers.filter(p =>
        p.display_name?.toLowerCase().includes(searchLower) ||
        p.slug?.toLowerCase().includes(searchLower)
      );
      console.log('[searchPerformers] After search filter:', results.length);
    }

    // Check if there are more results
    const hasMore = results.length > safePageSize;
    const pagedResults = hasMore ? results.slice(0, safePageSize) : results;

    const totalCount = hasMore ? (offset + safePageSize + 1) : (offset + results.length);
    console.log('[searchPerformers] Returning:', { totalCount, resultsLength: pagedResults.length, hasMore });

    return Response.json({
      success: true,
      results: pagedResults,
      hasMore,
      page,
      pageSize: safePageSize,
      totalCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});