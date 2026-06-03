import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Test search results for specific tag queries
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      1000
    );

    const testQueries = [
      { term: 'bareback', check: (v) => {
          const text = `${v.title || ''} ${v.description || ''}`.toLowerCase();
          const hasAnal = text.includes('anal') || text.includes('backdoor') || text.includes('ass fuck');
          const hasBare = text.includes('bare') || text.includes('raw') || text.includes('without condom');
          const hasTag = (v.tags || []).some(t => t.toLowerCase().includes('bareback'));
          return { hasTag, hasAnal, hasBare, correct: hasTag ? (hasAnal && hasBare) : true };
        }},
      { term: 'shower', check: (v) => {
          const text = `${v.title || ''} ${v.description || ''}`.toLowerCase();
          const hasShower = text.includes('shower') || text.includes('bathroom') || text.includes('wet');
          const hasTag = (v.tags || []).some(t => t.toLowerCase().includes('shower'));
          return { hasTag, hasShower, correct: hasTag ? hasShower : true };
        }},
      { term: 'solo', check: (v) => {
          const text = `${v.title || ''} ${v.description || ''}`.toLowerCase();
          const hasPartner = text.includes('partner') || text.includes('top ') || text.includes('bottom ') || text.includes('fuck');
          const hasTag = (v.tags || []).some(t => t.toLowerCase() === 'solo');
          return { hasTag, hasPartner, correct: hasTag ? !hasPartner : true };
        }},
      { term: 'blowjob', check: (v) => {
          const text = `${v.title || ''} ${v.description || ''}`.toLowerCase();
          const hasOral = text.includes('blow') || text.includes('suck') || text.includes('oral') || text.includes('throat');
          const hasTag = (v.tags || []).some(t => t.toLowerCase().includes('blowjob') || t.toLowerCase().includes('oral'));
          return { hasTag, hasOral, correct: hasTag ? hasOral : true };
        }},
      { term: 'dildo', check: (v) => {
          const text = `${v.title || ''} ${v.description || ''}`.toLowerCase();
          const hasToy = text.includes('dildo') || text.includes('toy') || text.includes('fleshlight');
          const hasTag = (v.tags || []).some(t => t.toLowerCase().includes('dildo') || t.toLowerCase().includes('toy'));
          return { hasTag, hasToy, correct: hasTag ? hasToy : true };
        }},
      { term: 'nipple', check: (v) => {
          const text = `${v.title || ''} ${v.description || ''}`.toLowerCase();
          const hasNipple = text.includes('nipple') || text.includes('clamp') || text.includes('torture');
          const hasTag = (v.tags || []).some(t => t.toLowerCase().includes('nipple'));
          return { hasTag, hasNipple, correct: hasTag ? hasNipple : true };
        }}
    ];

    const results = {};

    for (const query of testQueries) {
      const matches = allVideos.filter(v => {
        const checkResult = query.check(v);
        return checkResult.hasTag;
      });

      const incorrect = matches.filter(v => {
        const checkResult = query.check(v);
        return !checkResult.correct;
      });

      results[query.term] = {
        videosWithTag: matches.length,
        videosCorrectlyTagged: matches.length - incorrect.length,
        videosIncorrectlyTagged: incorrect.length,
        incorrectVideos: incorrect.map(v => ({
          video_id: v.id,
          title: v.title,
          slug: v.slug,
          tags: v.tags,
          reason: query.term === 'bareback' ? 'Tagged bareback but no anal+bare described' :
                  query.term === 'shower' ? 'Tagged shower but no shower described' :
                  query.term === 'solo' ? 'Tagged solo but has partner sex' :
                  query.term === 'blowjob' ? 'Tagged oral but no oral described' :
                  query.term === 'dildo' ? 'Tagged dildo but no toy described' :
                  'Tagged nipple but no nipple described'
        }))
      };
    }

    return Response.json({
      searchTestResults: results,
      summary: {
        allQueriesPass: Object.values(results).every(r => r.videosIncorrectlyTagged === 0),
        totalQueries: testQueries.length,
        queriesWithIssues: Object.values(results).filter(r => r.videosIncorrectlyTagged > 0).length
      }
    });

  } catch (error) {
    console.error('Search test error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});