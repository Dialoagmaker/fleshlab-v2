import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// PHASE 2A - Remove unsupported sensitive categories (evidence-based cleanup)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Evidence keywords for sensitive categories
    const evidenceRules = {
      'anal': ['anal', 'ass hole', 'backdoor', 'butt hole', 'hole', 'raw anal', 'anal play', 'anal sex'],
      'bareback': ['bareback', 'raw', 'no condom', 'without condom', 'cum inside', 'raw anal', 'bareback anal'],
      'oral': ['blow', 'suck', 'oral', 'throat', 'deep throat', 'head', 'mouth', 'oral sex'],
      'blowjob': ['blowjob', 'blow job', 'giving head', 'sucking cock', 'blow job'],
      'creampie': ['creampie', 'cum inside', 'fill up', 'breeding', 'cum in'],
      'rimming': ['rim', 'analingus', 'tongue', 'rim job', 'rimming']
    };

    // Fetch all published videos
    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      500
    );

    let updatedCount = 0;
    const updateLog = [];

    for (const video of allVideos) {
      const currentCategories = video.categories || [];
      const currentTags = video.tags || [];
      // Check title + description + tags for evidence
      const text = `${video.title || ''} ${video.description || ''} ${video.short_summary || ''} ${currentTags.join(' ')}`.toLowerCase();
      
      const newCategories = [];
      let needsUpdate = false;

      for (const category of currentCategories) {
        const catLower = category.toLowerCase();
        
        // Check if this is a sensitive category that needs evidence
        let needsEvidence = false;
        for (const [ruleCat, keywords] of Object.entries(evidenceRules)) {
          if (catLower === ruleCat) {
            needsEvidence = true;
            const hasEvidence = keywords.some(kw => text.includes(kw));
            if (hasEvidence) {
              newCategories.push(category);
            } else {
              needsUpdate = true;
              // Don't add to newCategories - removing it
            }
            break;
          }
        }
        
        // If not a sensitive category, keep it
        if (!needsEvidence) {
          newCategories.push(category);
        }
      }

      if (needsUpdate) {
        try {
          await base44.asServiceRole.entities.Video.update(video.id, {
            categories: newCategories
          });
          
          updatedCount++;
          updateLog.push({
            video_id: video.id,
            title: video.title,
            oldCategories: currentCategories,
            newCategories,
            removed: currentCategories.filter(c => !newCategories.includes(c)),
            reason: 'Removed sensitive categories without evidence in title/description/tags'
          });
        } catch (error) {
          updateLog.push({
            video_id: video.id,
            title: video.title,
            error: error.message
          });
        }
      }
    }

    return Response.json({
      phase: '2A_EVIDENCE_CLEANUP',
      summary: {
        videosAudited: allVideos.length,
        videosUpdated: updatedCount,
        totalCategoriesRemoved: updateLog.reduce((sum, v) => sum + (v.removed?.length || 0), 0)
      },
      updateLog: updateLog.slice(0, 30) // First 30 for brevity
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});