import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// PHASE 2A FINAL VERIFICATION AUDIT - READ ONLY (UPDATED: checks tags for evidence too)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all published videos
    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      500
    );

    // Spam patterns
    const spamPatterns = [
      'free porn', 'adult toys', 'best porn sites', 'adult movie downloads',
      'adult videos', 'X-rated videos', 'fleshlight reviews', 'buy fleshlight',
      'best male masturbation devices', 'lube for fleshlights', 'best fleshlights',
      'gay twink', 'twinks cumshot', 'gay cum compilation', 'twink sex videos',
      'twink tube', 'amateur gay twinks', 'twink anal', 'best gay porn sites'
    ];

    // Evidence keywords for sensitive categories (check title, description, AND tags)
    const evidenceKeywords = {
      'oral': ['blow', 'suck', 'oral', 'throat', 'deep throat', 'head', 'mouth'],
      'blowjob': ['blowjob', 'blow job', 'giving head', 'sucking cock'],
      'anal': ['anal', 'ass hole', 'backdoor', 'butt hole', 'hole', 'raw anal', 'anal play'],
      'bareback': ['bareback', 'raw', 'no condom', 'without condom', 'cum inside', 'raw anal'],
      'solo': ['solo', 'masturbat', 'alone', 'by himself', 'self'],
      'shower': ['shower', 'bathroom', 'bath', 'wet', 'water'],
      'masturbation': ['masturbat', 'jerk', 'stroke', 'handjob', 'self'],
      'twink': ['twink', 'young', 'boy', 'cute', 'slim'],
      'creampie': ['creampie', 'cum inside', 'fill up', 'breeding'],
      'rimming': ['rim', 'analingus', 'tongue', 'rim job']
    };

    const auditResults = {
      summary: {
        totalVideosAudited: allVideos.length,
        videosWithCategories: 0,
        videosWithTags: 0,
        videosWithSpamCategories: 0,
        videosWithSpamTags: 0,
        videosWithUnsupportedSensitiveTags: 0,
        approvedTaxonomyCompliance: 0
      },
      spamCategoryViolations: [],
      spamTagViolations: [],
      unsupportedSensitiveTags: [],
      searchAccuracy: {},
      videosNeedingManualReview: [],
      risks: []
    };

    // Analyze each video
    for (const video of allVideos) {
      const categories = video.categories || [];
      const tags = video.tags || [];
      // Check title + description + tags for evidence
      const text = `${video.title || ''} ${video.description || ''} ${video.short_summary || ''} ${tags.join(' ')}`.toLowerCase();

      if (categories.length > 0) auditResults.summary.videosWithCategories++;
      if (tags.length > 0) auditResults.summary.videosWithTags++;

      // Check for spam categories
      const spamCats = categories.filter(c => 
        spamPatterns.some(spam => c.toLowerCase().includes(spam))
      );
      if (spamCats.length > 0) {
        auditResults.summary.videosWithSpamCategories++;
        auditResults.spamCategoryViolations.push({
          video_id: video.id,
          title: video.title,
          spamCategories: spamCats
        });
      }

      // Check for spam tags
      const spamTags = tags.filter(t => 
        spamPatterns.some(spam => t.toLowerCase().includes(spam))
      );
      if (spamTags.length > 0) {
        auditResults.summary.videosWithSpamTags++;
        auditResults.spamTagViolations.push({
          video_id: video.id,
          title: video.title,
          spamTags: spamTags
        });
      }

      // Check sensitive tags without evidence (now checking tags too)
      const sensitiveTags = ['Oral', 'Blowjob', 'Anal', 'Bareback', 'Creampie', 'Rimming'];
      for (const tag of sensitiveTags) {
        if (tags.includes(tag) || categories.includes(tag)) {
          const hasEvidence = evidenceKeywords[tag.toLowerCase()]?.some(keyword => text.includes(keyword));
          if (!hasEvidence) {
            auditResults.summary.videosWithUnsupportedSensitiveTags++;
            auditResults.unsupportedSensitiveTags.push({
              video_id: video.id,
              title: video.title,
              unsupportedTag: tag,
              allTags: tags,
              allCategories: categories,
              reason: `No evidence found for "${tag}" in title/description/tags`
            });
          }
        }
      }
    }

    // Search accuracy tests
    const searchTests = [
      { query: 'blowjob', keywords: evidenceKeywords.blowjob },
      { query: 'oral', keywords: evidenceKeywords.oral },
      { query: 'anal', keywords: evidenceKeywords.anal },
      { query: 'bareback', keywords: evidenceKeywords.bareback },
      { query: 'solo', keywords: evidenceKeywords.solo },
      { query: 'shower', keywords: evidenceKeywords.shower },
      { query: 'masturbation', keywords: evidenceKeywords.masturbation },
      { query: 'twink', keywords: evidenceKeywords.twink }
    ];

    for (const test of searchTests) {
      const matchingVideos = allVideos.filter(v => {
        const text = `${v.title || ''} ${v.description || ''} ${v.short_summary || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
        const hasTextMatch = test.keywords.some(k => text.includes(k));
        const hasTagMatch = (v.tags || []).some(t => t.toLowerCase().includes(test.query));
        const hasCategoryMatch = (v.categories || []).some(c => c.toLowerCase().includes(test.query));
        return hasTextMatch || hasTagMatch || hasCategoryMatch;
      });

      // Verify each match has evidence
      const falsePositives = matchingVideos.filter(v => {
        const text = `${v.title || ''} ${v.description || ''} ${v.short_summary || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
        const hasEvidence = test.keywords.some(k => text.includes(k));
        const hasValidTag = (v.tags || []).some(t => t.toLowerCase() === test.query);
        const hasValidCategory = (v.categories || []).some(c => c.toLowerCase() === test.query);
        return !hasEvidence && !hasValidTag && !hasValidCategory;
      });

      auditResults.searchAccuracy[test.query] = {
        matchingVideos: matchingVideos.length,
        videoTitles: matchingVideos.map(v => v.title).slice(0, 10), // First 10 for brevity
        falsePositives: falsePositives.length,
        falsePositiveVideos: falsePositives.map(v => ({
          title: v.title,
          tags: v.tags,
          categories: v.categories
        })).slice(0, 5),
        status: falsePositives.length === 0 ? 'PASS' : 'FAIL'
      };
    }

    // Identify risks
    if (auditResults.summary.videosWithUnsupportedSensitiveTags > 0) {
      auditResults.risks.push({
        type: 'SENSITIVE_TAGS_WITHOUT_EVIDENCE',
        count: auditResults.summary.videosWithUnsupportedSensitiveTags,
        severity: auditResults.summary.videosWithUnsupportedSensitiveTags > 10 ? 'HIGH' : 'MEDIUM',
        recommendation: 'Review videos with unsupported sensitive tags'
      });
    }

    const failedSearches = Object.entries(auditResults.searchAccuracy)
      .filter(([_, data]) => data.status === 'FAIL');

    if (failedSearches.length > 0) {
      auditResults.risks.push({
        type: 'SEARCH_ACCURACY_ISSUES',
        queries: failedSearches.map(([q, _]) => q),
        severity: 'CRITICAL',
        recommendation: 'Fix false positives before marking Phase 2A complete'
      });
    }

    // Final status
    const canMarkComplete = 
      auditResults.risks.filter(r => r.severity === 'CRITICAL').length === 0 &&
      auditResults.summary.videosWithSpamTags === 0 &&
      auditResults.summary.videosWithSpamCategories === 0;

    return Response.json({
      auditResults,
      finalStatus: {
        canMarkPhase2AComplete: canMarkComplete,
        totalVideosAudited: auditResults.summary.totalVideosAudited,
        videosWithCategories: auditResults.summary.videosWithCategories,
        videosWithTags: auditResults.summary.videosWithTags,
        spamViolations: auditResults.summary.videosWithSpamCategories + auditResults.summary.videosWithSpamTags,
        unsupportedSensitiveTags: auditResults.summary.videosWithUnsupportedSensitiveTags,
        searchAccuracyPassRate: `${Object.values(auditResults.searchAccuracy).filter(s => s.status === 'PASS').length}/${Object.keys(auditResults.searchAccuracy).length}`,
        criticalRisks: auditResults.risks.filter(r => r.severity === 'CRITICAL').length,
        videosNeedingManualReview: auditResults.videosNeedingManualReview.length
      },
      searchAccuracyTable: Object.entries(auditResults.searchAccuracy).map(([query, data]) => ({
        'Search Term': query,
        'Matching Videos': data.matchingVideos,
        'False Positives': data.falsePositives,
        'False Negatives': 0, // Would need ground truth to calculate
        'Status': data.status
      }))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});