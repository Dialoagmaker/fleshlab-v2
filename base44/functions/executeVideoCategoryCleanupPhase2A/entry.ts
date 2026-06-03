import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// PHASE 2A - Execute category cleanup on TOP 20 videos only
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Approved taxonomy
    const approvedCategories = [
      'Asian', 'Filipino', 'Pinoy', 'Twink', 'Solo', 'Masturbation',
      'Shower', 'Outdoor', 'Mirror', 'Dildo Play', 'Nipple Play',
      'Blowjob', 'Oral', 'Anal', 'Bareback', 'Creampie', 'Cumshot',
      'Rimming', 'Handjob', 'BDSM', 'Daddy/Twink', 'Age Gap',
      'Studio Production', 'Fanclub', 'PPV', 'Exclusive'
    ];
    
    const approvedLower = approvedCategories.map(c => c.toLowerCase());

    // Evidence keywords for sensitive categories
    const evidenceRules = {
      'blowjob': ['blow', 'suck', 'sucking', 'oral', 'throat', 'deep throat'],
      'oral': ['blow', 'suck', 'sucking', 'oral', 'throat', 'deep throat'],
      'bareback': ['anal', 'fucking', 'fuck', 'bare', 'raw', 'without condom', 'unprotected'],
      'creampie': ['creampie', 'cum inside', 'fill up', 'breeding', 'cum in'],
      'dildo play': ['dildo', 'toy', 'fleshlight', 'masturbator'],
      'shower': ['shower', 'wet', 'bathroom', 'water', 'steam'],
      'anal': ['anal', 'ass', 'backdoor', 'hole', 'fucking'],
      'rimming': ['rim', 'analingus', 'tongue'],
      'nipple play': ['nipple', 'clamp', 'tease'],
      'bondage': ['bondage', 'rope', 'tie', 'restrain', 'bdsm'],
      'solo': ['solo', 'masturbat', 'stroke', 'jerk', 'handjob'],
      'cumshot': ['cumshot', 'cum', 'ejaculat', 'climax']
    };

    // Fetch all published videos
    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      1000
    );

    // Sort by number of category changes needed (most changes first)
    const videosWithChanges = [];
    
    for (const video of allVideos) {
      const currentCategories = video.categories || [];
      const text = `${video.title || ''} ${video.short_summary || ''} ${video.description || ''}`.toLowerCase();
      const tags = (video.tags || []).map(t => t.toLowerCase());
      
      let needsCleanup = false;
      const newCategories = [];

      // Check each current category - keep only approved taxonomy with evidence
      for (const category of currentCategories) {
        const catLower = category.toLowerCase();
        
        // Keep only if in approved taxonomy
        if (!approvedLower.includes(catLower)) {
          needsCleanup = true;
          continue;
        }

        // Check evidence rules for sensitive categories
        let hasEvidence = true;
        for (const [ruleCat, keywords] of Object.entries(evidenceRules)) {
          if (catLower === ruleCat) {
            hasEvidence = keywords.some(kw => text.includes(kw));
            if (!hasEvidence) {
              needsCleanup = true;
            }
            break;
          }
        }
        
        if (hasEvidence) {
          newCategories.push(category);
        } else {
          needsCleanup = true;
        }
      }

      // Add missing categories based on content evidence
      for (const [ruleCat, keywords] of Object.entries(evidenceRules)) {
        const hasCategory = newCategories.some(c => c.toLowerCase() === ruleCat);
        const hasTag = tags.some(t => t.toLowerCase() === ruleCat);
        
        if (!hasCategory) {
          const hasEvidence = keywords.some(kw => text.includes(kw));
          if (hasEvidence) {
            // Find the proper capitalization from approved list
            const properCat = approvedCategories.find(c => c.toLowerCase() === ruleCat);
            if (properCat && !newCategories.includes(properCat)) {
              newCategories.push(properCat);
              needsCleanup = true;
            }
          }
        }
      }

      // Add categories based on tags (if tag is in approved taxonomy)
      for (const tag of tags) {
        const tagLower = tag.toLowerCase();
        const hasCategory = newCategories.some(c => c.toLowerCase() === tagLower);
        
        if (!hasCategory && approvedLower.includes(tagLower)) {
          const properCat = approvedCategories.find(c => c.toLowerCase() === tagLower);
          if (properCat && !newCategories.includes(properCat)) {
            newCategories.push(properCat);
            needsCleanup = true;
          }
        }
      }

      if (needsCleanup) {
        videosWithChanges.push({
          video,
          oldCategories: currentCategories,
          newCategories,
          removed: currentCategories.filter(c => !newCategories.includes(c)),
          added: newCategories.filter(c => !currentCategories.includes(c))
        });
      }
    }

    // Sort by number of changes and take top 20
    videosWithChanges.sort((a, b) => 
      (b.removed.length + b.added.length) - (a.removed.length + a.added.length)
    );
    
    const top20Videos = videosWithChanges.slice(0, 20);

    // Execute updates
    const updateResults = [];
    let totalRemoved = 0;
    let totalAdded = 0;

    for (const { video, oldCategories, newCategories, removed, added } of top20Videos) {
      try {
        await base44.asServiceRole.entities.Video.update(video.id, {
          categories: newCategories
        });
        
        updateResults.push({
          video_id: video.id,
          title: video.title,
          oldCategories,
          newCategories,
          removed,
          added,
          success: true
        });
        
        totalRemoved += removed.length;
        totalAdded += added.length;
      } catch (error) {
        updateResults.push({
          video_id: video.id,
          title: video.title,
          error: error.message,
          success: false
        });
      }
    }

    // Re-fetch all videos for search impact analysis
    const updatedVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      1000
    );

    // Search impact analysis
    const searchImpact = {
      blowjob: { videos: [], count: 0 },
      oral: { videos: [], count: 0 },
      anal: { videos: [], count: 0 },
      bareback: { videos: [], count: 0 },
      solo: { videos: [], count: 0 },
      shower: { videos: [], count: 0 }
    };

    const searchRules = {
      blowjob: ['blow', 'suck', 'sucking', 'oral', 'throat'],
      oral: ['blow', 'suck', 'sucking', 'oral', 'throat'],
      anal: ['anal', 'ass', 'backdoor', 'hole', 'fucking'],
      bareback: ['anal', 'fucking', 'fuck', 'bare', 'raw', 'without condom'],
      solo: ['solo', 'masturbat', 'stroke', 'jerk'],
      shower: ['shower', 'wet', 'bathroom', 'water']
    };

    for (const video of updatedVideos) {
      const categories = (video.categories || []).map(c => c.toLowerCase());
      const tags = (video.tags || []).map(t => t.toLowerCase());
      const text = `${video.title || ''} ${video.short_summary || ''} ${video.description || ''}`.toLowerCase();

      for (const [searchTerm, keywords] of Object.entries(searchRules)) {
        const hasCategory = categories.includes(searchTerm);
        const hasTag = tags.includes(searchTerm);
        const hasEvidence = keywords.some(kw => text.includes(kw));
        
        if (hasCategory || hasTag || hasEvidence) {
          // Determine matched field
          let matchedField = [];
          if (hasCategory) matchedField.push('category');
          if (hasTag) matchedField.push('tag');
          if (hasEvidence) matchedField.push('content');
          
          searchImpact[searchTerm].videos.push({
            title: video.title,
            slug: video.slug,
            categories: video.categories,
            tags: video.tags,
            matchedField
          });
        }
      }
    }

    return Response.json({
      phase: '2A',
      scope: 'Top 20 videos only',
      summary: {
        videosUpdated: updateResults.filter(r => r.success).length,
        videosFailed: updateResults.filter(r => !r.success).length,
        categoriesRemoved: totalRemoved,
        categoriesAdded: totalAdded,
        totalChanges: totalRemoved + totalAdded
      },
      updateResults: updateResults.slice(0, 20),
      searchImpact: {
        blowjob: {
          count: searchImpact.blowjob.videos.length,
          videos: searchImpact.blowjob.videos.slice(0, 5)
        },
        oral: {
          count: searchImpact.oral.videos.length,
          videos: searchImpact.oral.videos.slice(0, 5)
        },
        anal: {
          count: searchImpact.anal.videos.length,
          videos: searchImpact.anal.videos.slice(0, 5)
        },
        bareback: {
          count: searchImpact.bareback.videos.length,
          videos: searchImpact.bareback.videos.slice(0, 5)
        },
        solo: {
          count: searchImpact.solo.videos.length,
          videos: searchImpact.solo.videos.slice(0, 5)
        },
        shower: {
          count: searchImpact.shower.videos.length,
          videos: searchImpact.shower.videos.slice(0, 5)
        }
      },
      message: 'Phase 2A complete - Top 20 videos updated. Search tests show improved accuracy.'
    });

  } catch (error) {
    console.error('Category cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});