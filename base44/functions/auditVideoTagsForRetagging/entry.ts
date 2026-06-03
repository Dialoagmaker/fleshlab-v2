import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only DRY RUN - proposes tag changes based on title/description/categories only
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

    const allVideoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({});
    const allPerformers = await base44.asServiceRole.entities.Performer.filter({ status: 'active' }, '-created_date', 500);
    const performerMap = new Map(allPerformers.map(p => [p.id, p]));

    const proposals = [];
    let totalTagsToRemove = 0;
    let totalTagsToAdd = 0;

    for (const video of allVideos) {
      const currentTags = video.tags || [];
      const title = (video.title || '').toLowerCase();
      const summary = (video.short_summary || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const categories = (video.categories || []).map(c => c.toLowerCase());
      
      // Combine all text for analysis
      const text = `${title} ${summary || ''} ${description || ''}`.toLowerCase();
      const categoryText = categories.join(' ').toLowerCase();

      // Get performer names
      const videoPerformerIds = allVideoPerformers
        .filter(vp => vp.video_id === video.id)
        .map(vp => vp.performer_id);
      const performerNames = videoPerformerIds
        .map(id => performerMap.get(id))
        .filter(Boolean)
        .map(p => p.display_name || '');

      const tagsToRemove = [];
      const tagsToAdd = [];
      const reasons = [];

      // === TAGS TO REMOVE ===
      for (const tag of currentTags) {
        const tagLower = tag.toLowerCase();

        // Forbidden/spam tags (always remove)
        if (tagLower.includes('teen') || tagLower.includes('barely legal')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": forbidden age-related term`);
          continue;
        }
        if (tagLower.includes('lesbian')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": misleading category`);
          continue;
        }
        if (tagLower.includes('dating') || tagLower.includes('fleshlight') || 
            tagLower.includes('adult film') || tagLower.includes('gay cam') || 
            tagLower.includes('lgbt')) {
          tagsToRemove.push(tag);
          reasons.push(`Remove "${tag}": spam/SEO term`);
          continue;
        }

        // Sex act tags - remove if NOT supported by content
        if ((tagLower === 'bareback' || tagLower === 'bareback anal')) {
          const hasAnal = text.includes('anal') || text.includes('backdoor') || text.includes('ass fuck');
          const hasBare = text.includes('bare') || text.includes('raw') || text.includes('without condom');
          if (!hasAnal || !hasBare) {
            tagsToRemove.push(tag);
            reasons.push(`Remove "${tag}": no anal/bareback described in content`);
            continue;
          }
        }

        if (tagLower === 'shower' || tagLower === 'shower solo') {
          if (!text.includes('shower') && !text.includes('bathroom') && !text.includes('wet')) {
            tagsToRemove.push(tag);
            reasons.push(`Remove "${tag}": no shower described`);
            continue;
          }
        }

        if (tagLower === 'solo' || tagLower === 'masturbation') {
          const hasPartner = text.includes('partner') || text.includes('top') || 
                            text.includes('bottom') || text.includes('fuck') || 
                            text.includes('anal sex');
          if (hasPartner) {
            tagsToRemove.push(tag);
            reasons.push(`Remove "${tag}": partner sex described, not solo`);
            continue;
          }
        }

        if (tagLower.includes('blowjob') || tagLower.includes('oral') || tagLower === 'deepthroat') {
          if (!text.includes('blow') && !text.includes('suck') && !text.includes('oral') && 
              !text.includes('throat') && !categoryText.includes('oral')) {
            tagsToRemove.push(tag);
            reasons.push(`Remove "${tag}": no oral described`);
            continue;
          }
        }

        if (tagLower === 'creampie') {
          if (!text.includes('creampie') && !text.includes('cum inside') && !text.includes('fill')) {
            tagsToRemove.push(tag);
            reasons.push(`Remove "${tag}": no creampie described`);
            continue;
          }
        }

        if (tagLower === 'dildo play' || tagLower.includes('dildo') || tagLower.includes('toy')) {
          if (!text.includes('dildo') && !text.includes('toy') && !text.includes('fleshlight')) {
            tagsToRemove.push(tag);
            reasons.push(`Remove "${tag}": no toy/dildo described`);
            continue;
          }
        }

        if (tagLower === 'nipple play' || tagLower.includes('nipple')) {
          if (!text.includes('nipple') && !text.includes('clamp') && !text.includes('torture')) {
            tagsToRemove.push(tag);
            reasons.push(`Remove "${tag}": no nipple play described`);
            continue;
          }
        }
      }

      // === TAGS TO ADD ===
      const currentTagsLower = currentTags.map(t => t.toLowerCase());
      const tagsToRemoveLower = tagsToRemove.map(t => t.toLowerCase());

      // Solo - only if NO partner described
      const hasPartner = text.includes('partner') || text.includes('top ') || 
                        text.includes('bottom ') || text.includes('fuck') || 
                        text.includes('anal sex') || text.includes('with ');
      if ((text.includes('solo') || text.includes('masturbat') || text.includes('jerk') || 
           text.includes('stroke')) && !hasPartner) {
        if (!currentTagsLower.includes('solo') && !tagsToRemoveLower.includes('solo')) {
          tagsToAdd.push('Solo');
          reasons.push('Add "Solo": masturbation described, no partner');
        }
      }

      // Shower
      if ((text.includes('shower') || text.includes('bathroom') || text.includes('wet')) &&
          !currentTagsLower.includes('shower') && !currentTagsLower.includes('shower solo') &&
          !tagsToRemoveLower.includes('shower') && !tagsToRemoveLower.includes('shower solo')) {
        tagsToAdd.push('Shower');
        reasons.push('Add "Shower": shower/bathroom described');
      }

      // Blowjob/Oral
      if ((text.includes('blowjob') || text.includes('blow job') || text.includes('suck') || 
           text.includes('deepthroat') || categoryText.includes('oral')) &&
          !currentTagsLower.some(t => t.includes('blowjob') || t.includes('oral')) &&
          !tagsToRemoveLower.some(t => t.includes('blowjob') || t.includes('oral'))) {
        tagsToAdd.push('Blowjob');
        tagsToAdd.push('Oral');
        reasons.push('Add "Blowjob/Oral": oral sex described');
      }

      // Creampie
      if ((text.includes('creampie') || text.includes('cum inside') || text.includes('fill him')) &&
          !currentTagsLower.includes('creampie') && !tagsToRemoveLower.includes('creampie')) {
        tagsToAdd.push('Creampie');
        reasons.push('Add "Creampie": creampie described');
      }

      // Dildo Play
      if ((text.includes('dildo') || text.includes('toy') || text.includes('fleshlight')) &&
          !currentTagsLower.some(t => t.includes('dildo') || t.includes('toy')) &&
          !tagsToRemoveLower.some(t => t.includes('dildo') || t.includes('toy'))) {
        tagsToAdd.push('Dildo Play');
        reasons.push('Add "Dildo Play": toy/dildo described');
      }

      // Nipple Play
      if ((text.includes('nipple') || text.includes('clamp') || text.includes('torture')) &&
          !currentTagsLower.some(t => t.includes('nipple')) &&
          !tagsToRemoveLower.some(t => t.includes('nipple'))) {
        tagsToAdd.push('Nipple Play');
        reasons.push('Add "Nipple Play": nipple play described');
      }

      // Bareback - STRICT: only if anal + bare/raw
      const hasAnal = text.includes('anal') || text.includes('backdoor') || text.includes('ass fuck');
      const hasBare = text.includes('bare') || text.includes('raw') || text.includes('without condom');
      if (hasAnal && hasBare &&
          !currentTagsLower.includes('bareback') && !tagsToRemoveLower.includes('bareback')) {
        tagsToAdd.push('Bareback');
        reasons.push('Add "Bareback": bareback anal described');
      }

      totalTagsToRemove += tagsToRemove.length;
      totalTagsToAdd += tagsToAdd.length;

      if (tagsToRemove.length > 0 || tagsToAdd.length > 0) {
        proposals.push({
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          currentTags,
          short_summary: video.short_summary || '',
          description: video.description || '',
          categories: video.categories || [],
          tagsToRemove,
          tagsToAdd,
          reasons,
          totalChanges: tagsToRemove.length + tagsToAdd.length
        });
      }
    }

    // Sort by most changes
    proposals.sort((a, b) => b.totalChanges - a.totalChanges);

    const videosNeedingChanges = proposals.length;
    const videosAlreadyCorrect = allVideos.length - videosNeedingChanges;

    return Response.json({
      summary: {
        totalVideosChecked: allVideos.length,
        videosNeedingRetagging: videosNeedingChanges,
        videosAlreadyCorrect,
        totalTagsToRemove,
        totalTagsToAdd,
        totalTagChanges: totalTagsToRemove + totalTagsToAdd,
        averageChangesPerVideo: videosNeedingChanges > 0 ? 
          ((totalTagsToRemove + totalTagsToAdd) / videosNeedingChanges).toFixed(1) : '0'
      },
      top20MostChangedVideos: proposals.slice(0, 20),
      allProposals: proposals
    });

  } catch (error) {
    console.error('Retagging audit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});