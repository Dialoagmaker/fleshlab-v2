import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only audit function to propose clean tags for all videos
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
      1000
    );

    // Fetch performer relationships
    const allVideoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({});
    const allPerformers = await base44.asServiceRole.entities.Performer.filter({ status: 'active' }, '-created_date', 500);
    const performerMap = new Map(allPerformers.map(p => [p.id, p]));

    const auditResults = {
      totalVideos: allVideos.length,
      videosNeedingRetagging: 0,
      videosAlreadyCorrect: 0,
      totalTagChangesProposed: 0,
      videosProposals: []
    };

    for (const video of allVideos) {
      const currentTags = video.tags || [];
      const title = (video.title || '').toLowerCase();
      const summary = (video.short_summary || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const categories = (video.categories || []).map(c => c.toLowerCase());
      const combinedText = `${title} ${summary} ${description} ${categories.join(' ')}`;

      // Get performer names for this video
      const videoPerformerIds = allVideoPerformers
        .filter(vp => vp.video_id === video.id)
        .map(vp => vp.performer_id);
      const performerNames = videoPerformerIds
        .map(id => performerMap.get(id))
        .filter(Boolean)
        .map(p => p.display_name?.toLowerCase() || '');

      const suggestedTags = [];
      const tagsToRemove = [];
      const tagsToAdd = [];
      const reasons = [];

      // === SUGGEST TAGS BASED ON CONTENT ===
      
      // Core identity tags
      if (combinedText.includes('filipino') || combinedText.includes('pinoy')) {
        suggestedTags.push('Filipino');
      }
      if (combinedText.includes('asian')) {
        suggestedTags.push('Asian');
      }
      if (combinedText.includes('twink')) {
        suggestedTags.push('Twink');
      }
      if (combinedText.includes('smooth')) {
        suggestedTags.push('Smooth');
      }
      if (combinedText.includes('fit') || combinedText.includes('muscular')) {
        suggestedTags.push('Fit');
      }
      if (combinedText.includes('hunk')) {
        suggestedTags.push('Hunk');
      }

      // Scene type tags
      if (combinedText.includes('shower') || combinedText.includes('bathroom') || combinedText.includes('wet')) {
        suggestedTags.push('Shower Solo');
      }
      if (combinedText.includes('solo') || combinedText.includes('masturbat') || combinedText.includes('jerk')) {
        suggestedTags.push('Solo');
        suggestedTags.push('Masturbation');
      }
      if (combinedText.includes('edg')) {
        suggestedTags.push('Edging');
      }
      if (combinedText.includes('nipple')) {
        suggestedTags.push('Nipple Play');
      }
      if (combinedText.includes('dildo') || combinedText.includes('toy')) {
        suggestedTags.push('Dildo Play');
      }
      if (combinedText.includes('cumshot') || combinedText.includes('cum shot') || combinedText.includes('messy')) {
        suggestedTags.push('Cumshot');
      }
      if (combinedText.includes('handjob') || combinedText.includes('stroke')) {
        suggestedTags.push('Handjob');
      }

      // Sex act tags - ONLY if clearly supported
      if (combinedText.includes('blow') || combinedText.includes('oral') || combinedText.includes('suck')) {
        suggestedTags.push('Gay Blowjob');
        suggestedTags.push('Oral');
      }
      if (combinedText.includes('deepthroat')) {
        suggestedTags.push('Deepthroat');
      }
      if (combinedText.includes('anal') || combinedText.includes('backdoor') || combinedText.includes('ass')) {
        suggestedTags.push('Anal');
      }
      if (combinedText.includes('bare') || combinedText.includes('raw') || combinedText.includes('without condom')) {
        suggestedTags.push('Bareback');
      }
      if (combinedText.includes('fuck') || combinedText.includes('pound') || combinedText.includes('sex')) {
        suggestedTags.push('Gay Fucking');
      }
      if (combinedText.includes('creampie') || combinedText.includes('cum inside')) {
        suggestedTags.push('Creampie');
      }

      // Role tags
      if (combinedText.includes('top') || combinedText.includes('dominant') || combinedText.includes('muscle')) {
        suggestedTags.push('Top');
      }
      if (combinedText.includes('bottom') || combinedText.includes('submissive')) {
        suggestedTags.push('Bottom');
      }
      if (combinedText.includes('daddy')) {
        suggestedTags.push('Daddy');
      }

      // Production tags
      if (video.access_tier === 'fanclub') {
        suggestedTags.push('Fanclub');
      }
      if (video.access_tier === 'ppv') {
        suggestedTags.push('PPV');
      }
      if (video.is_exclusive) {
        suggestedTags.push('Exclusive');
      }

      // Performer name tags
      performerNames.forEach(name => {
        if (name && name.trim()) {
          suggestedTags.push(name);
        }
      });

      // === IDENTIFY TAGS TO REMOVE ===
      const currentTagsLower = currentTags.map(t => t.toLowerCase());
      const suggestedTagsLower = suggestedTags.map(t => t.toLowerCase());

      // Remove tags not supported by content
      for (const tag of currentTags) {
        const tagLower = tag.toLowerCase();
        
        // Always remove forbidden tags
        if (tagLower.includes('lesbian') || tagLower.includes('teen') || tagLower.includes('barely legal') ||
            tagLower.includes('dating') || tagLower.includes('fleshlight') || tagLower.includes('adult film') ||
            tagLower.includes('gay cam') || tagLower.includes('gay chat') || tagLower.includes('lgbt')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": forbidden/spam tag`);
          continue;
        }

        // Remove sex act tags not supported by content
        if ((tagLower === 'bareback' || tagLower === 'bareback anal') && 
            !combinedText.includes('bare') && !combinedText.includes('raw')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": not supported by content (solo/shower video)`);
          continue;
        }

        if ((tagLower === 'anal' || tagLower === 'bareback anal') && 
            !combinedText.includes('anal') && !combinedText.includes('backdoor') && !combinedText.includes('ass')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": not supported by content`);
          continue;
        }

        if ((tagLower === 'blowjob' || tagLower === 'oral' || tagLower === 'deepthroat') && 
            !combinedText.includes('blow') && !combinedText.includes('oral') && !combinedText.includes('suck')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": not supported by content`);
          continue;
        }

        if (tagLower === 'creampie' && 
            !combinedText.includes('creampie') && !combinedText.includes('cum inside')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": not supported by content`);
          continue;
        }

        if ((tagLower.includes('fuck') || tagLower === 'gay fucking') && 
            !combinedText.includes('fuck') && !combinedText.includes('pound') && !combinedText.includes('sex')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": not supported by content`);
          continue;
        }
      }

      // === IDENTIFY TAGS TO ADD ===
      for (const tag of suggestedTags) {
        const tagLower = tag.toLowerCase();
        if (!currentTagsLower.includes(tagLower)) {
          tagsToAdd.push(tag);
          reasons.push(`Add "${tag}": supported by content`);
        }
      }

      // Count changes
      const totalChanges = tagsToRemove.length + tagsToAdd.length;
      if (totalChanges > 0) {
        auditResults.videosNeedingRetagging++;
        auditResults.totalTagChangesProposed += totalChanges;
        
        auditResults.videosProposals.push({
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          currentTags: currentTags,
          short_summary: video.short_summary,
          categories: video.categories,
          suggestedTags: [...new Set(suggestedTags)],
          tagsToRemove: [...new Set(tagsToRemove)],
          tagsToAdd: [...new Set(tagsToAdd)],
          reasons: reasons,
          totalChanges: totalChanges
        });
      } else {
        auditResults.videosAlreadyCorrect++;
      }
    }

    // Sort by most changes
    auditResults.videosProposals.sort((a, b) => b.totalChanges - a.totalChanges);

    // Get top 20
    const top20 = auditResults.videosProposals.slice(0, 20);

    return Response.json({
      summary: {
        totalVideosChecked: auditResults.totalVideos,
        videosNeedingRetagging: auditResults.videosNeedingRetagging,
        videosAlreadyCorrect: auditResults.videosAlreadyCorrect,
        totalTagChangesProposed: auditResults.totalTagChangesProposed,
        averageChangesPerVideo: auditResults.videosNeedingRetagging > 0 ? 
          (auditResults.totalTagChangesProposed / auditResults.videosNeedingRetagging).toFixed(1) : '0'
      },
      top20MostChangedVideos: top20,
      allVideosProposals: auditResults.videosProposals
    });

  } catch (error) {
    console.error('Video retagging audit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});