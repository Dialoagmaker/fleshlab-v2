import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// DRY RUN ONLY - Audit video categories against approved taxonomy and content evidence
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
      'blowjob': ['blow', 'suck', 'oral', 'throat', 'deep throat'],
      'oral': ['blow', 'suck', 'oral', 'throat', 'deep throat'],
      'bareback': ['anal', 'fucking', 'bare', 'raw', 'without condom', 'unprotected'],
      'creampie': ['creampie', 'cum inside', 'fill up', 'breeding'],
      'dildo play': ['dildo', 'toy', 'fleshlight', 'masturbator'],
      'shower': ['shower', 'wet', 'bathroom', 'water', 'steam'],
      'anal': ['anal', 'ass', 'backdoor', 'hole'],
      'rimming': ['rim', 'analingus', 'tongue'],
      'nipple play': ['nipple', 'clamp', 'tease'],
      'bondage': ['bondage', 'rope', 'tie', 'restrain', 'bdsm']
    };

    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      1000
    );

    const auditResults = {
      totalVideos: allVideos.length,
      videosNeedingCleanup: 0,
      categoryChanges: [],
      categoriesToRemove: {},
      categoriesToAdd: {},
      searchImpact: {
        blowjob: { videosWithTag: 0, videosWithCategory: 0, correctlySupported: 0, unsupported: [] },
        oral: { videosWithTag: 0, videosWithCategory: 0, correctlySupported: 0, unsupported: [] },
        bareback: { videosWithTag: 0, videosWithCategory: 0, correctlySupported: 0, unsupported: [] },
        anal: { videosWithTag: 0, videosWithCategory: 0, correctlySupported: 0, unsupported: [] },
        solo: { videosWithTag: 0, videosWithCategory: 0, correctlySupported: 0, unsupported: [] },
        shower: { videosWithTag: 0, videosWithCategory: 0, correctlySupported: 0, unsupported: [] }
      },
      spamCategories: [],
      taxonomyViolations: []
    };

    for (const video of allVideos) {
      const currentCategories = video.categories || [];
      const text = `${video.title || ''} ${video.short_summary || ''} ${video.description || ''}`.toLowerCase();
      const tags = (video.tags || []).map(t => t.toLowerCase());
      
      let needsCleanup = false;
      const changes = {
        video_id: video.id,
        title: video.title,
        slug: video.slug,
        currentCategories: [...currentCategories],
        categoriesToRemove: [],
        categoriesToAdd: [],
        reasons: []
      };

      // Check each current category
      for (const category of currentCategories) {
        const catLower = category.toLowerCase();
        
        // Check if category is in approved taxonomy
        if (!approvedLower.includes(catLower)) {
          changes.categoriesToRemove.push(category);
          changes.reasons.push(`Not in approved taxonomy: "${category}"`);
          needsCleanup = true;
          
          // Track spam categories
          if (!auditResults.categoriesToRemove[category]) {
            auditResults.categoriesToRemove[category] = { count: 0, videos: [], reason: 'Not in approved taxonomy' };
          }
          auditResults.categoriesToRemove[category].count++;
          auditResults.categoriesToRemove[category].videos.push(video.title);
          
          // Check for spammy patterns
          if (category.length > 30 || 
              category.includes('free porn') || 
              category.includes('best') || 
              category.includes('2023') ||
              category.includes('fleshlight') ||
              category.includes('lube') ||
              category.includes('buy') ||
              category.includes('review')) {
            auditResults.spamCategories.push({
              video_id: video.id,
              title: video.title,
              category: category,
              reason: 'SEO spam detected'
            });
          }
          continue;
        }

        // Check evidence rules for sensitive categories
        for (const [ruleCat, keywords] of Object.entries(evidenceRules)) {
          if (catLower === ruleCat) {
            const hasEvidence = keywords.some(kw => text.includes(kw));
            if (!hasEvidence) {
              changes.categoriesToRemove.push(category);
              changes.reasons.push(`No evidence for "${category}" in title/summary/description`);
              needsCleanup = true;
              
              if (!auditResults.categoriesToRemove[category]) {
                auditResults.categoriesToRemove[category] = { count: 0, videos: [], reason: 'No content evidence' };
              }
              auditResults.categoriesToRemove[category].count++;
              auditResults.categoriesToRemove[category].videos.push(video.title);
            }
          }
        }
      }

      // Check for missing categories that should be added based on tags
      for (const tag of tags) {
        const tagLower = tag.toLowerCase();
        // If tag is in approved taxonomy but not in categories
        if (approvedLower.includes(tagLower) && !currentCategories.some(c => c.toLowerCase() === tagLower)) {
          // Check if we're not already removing it
          if (!changes.categoriesToRemove.some(c => c.toLowerCase() === tagLower)) {
            changes.categoriesToAdd.push(tag);
            changes.reasons.push(`Add "${tag}" to match existing tag`);
            needsCleanup = true;
            
            if (!auditResults.categoriesToAdd[tag]) {
              auditResults.categoriesToAdd[tag] = { count: 0, videos: [] };
            }
            auditResults.categoriesToAdd[tag].count++;
            auditResults.categoriesToAdd[tag].videos.push(video.title);
          }
        }
      }

      // Check for categories that should be added based on content evidence
      // (only if not already in categories and not being removed)
      for (const [ruleCat, keywords] of Object.entries(evidenceRules)) {
        const hasCategory = currentCategories.some(c => c.toLowerCase() === ruleCat);
        const hasTag = tags.some(t => t.toLowerCase() === ruleCat);
        const hasEvidence = keywords.some(kw => text.includes(kw));
        
        if (hasEvidence && !hasCategory && !hasTag && !changes.categoriesToAdd.includes(ruleCat)) {
          // Only suggest if strong evidence
          const evidenceCount = keywords.filter(kw => text.includes(kw)).length;
          if (evidenceCount >= 2) {
            changes.categoriesToAdd.push(ruleCat);
            changes.reasons.push(`Add "${ruleCat}" based on content evidence (${evidenceCount} matches)`);
            needsCleanup = true;
          }
        }
      }

      // Track search impact for key categories
      const keyCategories = ['blowjob', 'oral', 'bareback', 'anal', 'solo', 'shower'];
      for (const keyCat of keyCategories) {
        const hasCategory = currentCategories.some(c => c.toLowerCase() === keyCat);
        const hasTag = tags.some(t => t.toLowerCase() === keyCat);
        
        if (hasCategory) {
          auditResults.searchImpact[keyCat].videosWithCategory++;
          
          // Check if supported
          const keywords = evidenceRules[keyCat] || [];
          const hasEvidence = keywords.some(kw => text.includes(kw));
          
          if (hasEvidence) {
            auditResults.searchImpact[keyCat].correctlySupported++;
          } else {
            auditResults.searchImpact[keyCat].unsupported.push({
              video_id: video.id,
              title: video.title,
              category: keyCat,
              reason: 'Category present but no content evidence'
            });
          }
        }
        
        if (hasTag) {
          auditResults.searchImpact[keyCat].videosWithTag++;
        }
      }

      if (needsCleanup) {
        auditResults.videosNeedingCleanup++;
        auditResults.categoryChanges.push(changes);
        
        // Track taxonomy violations
        if (changes.categoriesToRemove.length > 0 || changes.categoriesToAdd.length > 0) {
          auditResults.taxonomyViolations.push({
            video_id: video.id,
            title: video.title,
            removals: changes.categoriesToRemove.length,
            additions: changes.categoriesToAdd.length
          });
        }
      }
    }

    // Sort category changes by number of changes
    auditResults.categoryChanges.sort((a, b) => 
      (b.categoriesToRemove.length + b.categoriesToAdd.length) - 
      (a.categoriesToRemove.length + a.categoriesToAdd.length)
    );

    // Get top 20 category changes
    const top20Changes = auditResults.categoryChanges.slice(0, 20);

    // Format categories to remove/add
    const categoriesToRemoveList = Object.entries(auditResults.categoriesToRemove)
      .map(([cat, data]) => ({
        category: cat,
        count: data.count,
        reason: data.reason,
        sampleVideos: data.videos.slice(0, 3)
      }))
      .sort((a, b) => b.count - a.count);

    const categoriesToAddList = Object.entries(auditResults.categoriesToAdd)
      .map(([cat, data]) => ({
        category: cat,
        count: data.count,
        sampleVideos: data.videos.slice(0, 3)
      }))
      .sort((a, b) => b.count - a.count);

    return Response.json({
      summary: {
        totalVideos: auditResults.totalVideos,
        videosNeedingCleanup: auditResults.videosNeedingCleanup,
        videosAlreadyClean: auditResults.totalVideos - auditResults.videosNeedingCleanup,
        totalCategoriesToRemove: Object.values(auditResults.categoriesToRemove).reduce((sum, d) => sum + d.count, 0),
        totalCategoriesToAdd: Object.values(auditResults.categoriesToAdd).reduce((sum, d) => sum + d.count, 0),
        spamCategoriesFound: auditResults.spamCategories.length,
        taxonomyViolations: auditResults.taxonomyViolations.length
      },
      top20CategoryChanges: top20Changes,
      categoriesToRemove: categoriesToRemoveList.slice(0, 20),
      categoriesToAdd: categoriesToAddList.slice(0, 20),
      searchImpact: auditResults.searchImpact,
      spamCategories: auditResults.spamCategories.slice(0, 10),
      dryRun: true,
      message: 'DRY RUN ONLY - No updates applied. Review changes before executing.'
    });

  } catch (error) {
    console.error('Category audit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});