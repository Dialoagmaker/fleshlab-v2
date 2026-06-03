import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// PHASE 2A FINAL CLEANUP - Remove all spam and unsupported sensitive tags
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

    // Spam patterns to remove
    const spamPatterns = [
      'free porn', 'adult toys', 'best porn sites', 
      'adult movie downloads', 'adult videos', 'X-rated videos',
      'fleshlight reviews', 'buy fleshlight online', 
      'best male masturbation devices', 'lube for fleshlights',
      'best fleshlights', 'gay twink', 'twinks cumshot',
      'gay cum compilation', 'twink sex videos', 'twink tube',
      'amateur gay twinks', 'twink anal', 'best gay porn sites',
      'gay adult', 'teen gay', 'gay boy', 'asian gay',
      'gay asian', 'top gay', 'gay porn', 'twink websites',
      'gay twink porn', 'cute asian guys', 'young twink',
      'asian twink fuck', 'asian gay boy', 'twink solo',
      'cute twink', 'twink cumshot', 'gay twinks',
      'twink videos', 'gay adult movies', 'twink cumshots',
      'twink websites', 'twink tube', 'top gay porn',
      'sexy twink', 'intimate pleasure', 'hard cock',
      'solo jackoff', 'cum shot'
    ];

    // Fetch all published videos
    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      1000
    );

    let updatedCount = 0;
    const updateLog = [];

    for (const video of allVideos) {
      const currentCategories = video.categories || [];
      const currentTags = video.tags || [];
      const text = `${video.title || ''} ${video.short_summary || ''} ${video.description || ''}`.toLowerCase();
      
      let needsUpdate = false;
      
      // Clean categories
      const newCategories = [];
      for (const category of currentCategories) {
        const catLower = category.toLowerCase();
        
        // Skip spam categories
        if (spamPatterns.some(spam => catLower.includes(spam))) {
          needsUpdate = true;
          continue;
        }
        
        // Keep only approved taxonomy
        if (!approvedLower.includes(catLower)) {
          needsUpdate = true;
          continue;
        }
        
        // Check evidence for sensitive categories
        let hasEvidence = true;
        for (const [ruleCat, keywords] of Object.entries(evidenceRules)) {
          if (catLower === ruleCat) {
            hasEvidence = keywords.some(kw => text.includes(kw));
            if (!hasEvidence) {
              needsUpdate = true;
            }
            break;
          }
        }
        
        if (hasEvidence) {
          newCategories.push(category);
        } else {
          needsUpdate = true;
        }
      }

      // Clean tags - remove spam patterns
      const newTags = currentTags.filter(t => 
        !spamPatterns.some(spam => t.toLowerCase().includes(spam))
      );
      
      if (newTags.length !== currentTags.length) {
        needsUpdate = true;
      }

      // Remove unsupported sensitive tags
      const sensitiveTags = ['Blowjob', 'Oral', 'Bareback', 'Anal', 'Creampie', 'Rimming'];
      const filteredTags = newTags.filter(t => {
        const tLower = t.toLowerCase();
        if (!sensitiveTags.some(s => s.toLowerCase() === tLower)) {
          return true;
        }
        // Check if evidence exists
        for (const [ruleCat, keywords] of Object.entries(evidenceRules)) {
          if (tLower === ruleCat) {
            return keywords.some(kw => text.includes(kw));
          }
        }
        return true;
      });

      if (filteredTags.length !== newTags.length) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        try {
          await base44.asServiceRole.entities.Video.update(video.id, {
            categories: newCategories,
            tags: filteredTags
          });
          
          updatedCount++;
          updateLog.push({
            video_id: video.id,
            title: video.title,
            oldCategories: currentCategories,
            newCategories,
            oldTags: currentTags,
            newTags: filteredTags,
            categoriesRemoved: currentCategories.filter(c => !newCategories.includes(c)),
            tagsRemoved: currentTags.filter(t => !filteredTags.includes(t))
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
      phase: '2A_FINAL',
      summary: {
        videosAudited: allVideos.length,
        videosUpdated: updatedCount,
        totalChanges: updateLog.reduce((sum, v) => 
          sum + (v.categoriesRemoved?.length || 0) + (v.tagsRemoved?.length || 0), 0
        )
      },
      updateLog: updateLog.slice(0, 30) // Return first 30 for brevity
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});