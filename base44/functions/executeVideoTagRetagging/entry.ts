import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only execution - applies tag changes from auditVideoTagsForRetagging
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

    let videosUpdated = 0;
    let totalTagsRemoved = 0;
    let totalTagsAdded = 0;
    const updateLog = [];

    for (const video of allVideos) {
      const currentTags = video.tags || [];
      const title = (video.title || '').toLowerCase();
      const summary = (video.short_summary || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const categories = (video.categories || []).map(c => c.toLowerCase());
      
      const text = `${title} ${summary || ''} ${description || ''}`.toLowerCase();
      const categoryText = categories.join(' ').toLowerCase();

      const videoPerformerIds = allVideoPerformers
        .filter(vp => vp.video_id === video.id)
        .map(vp => vp.performer_id);
      const performerNames = videoPerformerIds
        .map(id => performerMap.get(id))
        .filter(Boolean)
        .map(p => p.display_name || '');

      const tagsToRemove = [];
      const tagsToAdd = [];

      // === TAGS TO REMOVE ===
      for (const tag of currentTags) {
        const tagLower = tag.toLowerCase();

        // Forbidden/spam tags
        if (tagLower.includes('teen') || tagLower.includes('barely legal')) {
          tagsToRemove.push(tag);
          continue;
        }
        if (tagLower.includes('lesbian')) {
          tagsToRemove.push(tag);
          continue;
        }
        if (tagLower.includes('dating') || tagLower.includes('fleshlight') || 
            tagLower.includes('adult film') || tagLower.includes('gay cam') || 
            tagLower.includes('lgbt')) {
          tagsToRemove.push(tag);
          continue;
        }

        // Sex act tags - remove if NOT supported
        if ((tagLower === 'bareback' || tagLower === 'bareback anal')) {
          const hasAnal = text.includes('anal') || text.includes('backdoor') || text.includes('ass fuck');
          const hasBare = text.includes('bare') || text.includes('raw') || text.includes('without condom');
          if (!hasAnal || !hasBare) {
            tagsToRemove.push(tag);
            continue;
          }
        }

        if (tagLower === 'shower' || tagLower === 'shower solo') {
          if (!text.includes('shower') && !text.includes('bathroom') && !text.includes('wet')) {
            tagsToRemove.push(tag);
            continue;
          }
        }

        if (tagLower === 'solo' || tagLower === 'masturbation') {
          const hasPartner = text.includes('partner') || text.includes('top ') || 
                            text.includes('bottom ') || text.includes('fuck') || 
                            text.includes('anal sex');
          if (hasPartner) {
            tagsToRemove.push(tag);
            continue;
          }
        }

        if (tagLower.includes('blowjob') || tagLower.includes('oral') || tagLower === 'deepthroat') {
          if (!text.includes('blow') && !text.includes('suck') && !text.includes('oral') && 
              !text.includes('throat') && !categoryText.includes('oral')) {
            tagsToRemove.push(tag);
            continue;
          }
        }

        if (tagLower === 'creampie') {
          if (!text.includes('creampie') && !text.includes('cum inside') && !text.includes('fill')) {
            tagsToRemove.push(tag);
            continue;
          }
        }

        if (tagLower === 'dildo play' || tagLower.includes('dildo') || tagLower.includes('toy')) {
          if (!text.includes('dildo') && !text.includes('toy') && !text.includes('fleshlight')) {
            tagsToRemove.push(tag);
            continue;
          }
        }

        if (tagLower === 'nipple play' || tagLower.includes('nipple')) {
          if (!text.includes('nipple') && !text.includes('clamp') && !text.includes('torture')) {
            tagsToRemove.push(tag);
            continue;
          }
        }
      }

      // === TAGS TO ADD ===
      const currentTagsLower = currentTags.map(t => t.toLowerCase());
      const tagsToRemoveLower = tagsToRemove.map(t => t.toLowerCase());

      // Solo
      const hasPartner = text.includes('partner') || text.includes('top ') || 
                        text.includes('bottom ') || text.includes('fuck') || 
                        text.includes('anal sex') || text.includes('with ');
      if ((text.includes('solo') || text.includes('masturbat') || text.includes('jerk') || 
           text.includes('stroke')) && !hasPartner) {
        if (!currentTagsLower.includes('solo') && !tagsToRemoveLower.includes('solo')) {
          tagsToAdd.push('Solo');
        }
      }

      // Shower
      if ((text.includes('shower') || text.includes('bathroom') || text.includes('wet')) &&
          !currentTagsLower.includes('shower') && !currentTagsLower.includes('shower solo') &&
          !tagsToRemoveLower.includes('shower') && !tagsToRemoveLower.includes('shower solo')) {
        tagsToAdd.push('Shower');
      }

      // Blowjob/Oral
      if ((text.includes('blowjob') || text.includes('blow job') || text.includes('suck') || 
           text.includes('deepthroat') || categoryText.includes('oral')) &&
          !currentTagsLower.some(t => t.includes('blowjob') || t.includes('oral')) &&
          !tagsToRemoveLower.some(t => t.includes('blowjob') || t.includes('oral'))) {
        tagsToAdd.push('Blowjob');
        tagsToAdd.push('Oral');
      }

      // Creampie
      if ((text.includes('creampie') || text.includes('cum inside') || text.includes('fill him')) &&
          !currentTagsLower.includes('creampie') && !tagsToRemoveLower.includes('creampie')) {
        tagsToAdd.push('Creampie');
      }

      // Dildo Play
      if ((text.includes('dildo') || text.includes('toy') || text.includes('fleshlight')) &&
          !currentTagsLower.some(t => t.includes('dildo') || t.includes('toy')) &&
          !tagsToRemoveLower.some(t => t.includes('dildo') || t.includes('toy'))) {
        tagsToAdd.push('Dildo Play');
      }

      // Nipple Play
      if ((text.includes('nipple') || text.includes('clamp') || text.includes('torture')) &&
          !currentTagsLower.some(t => t.includes('nipple')) &&
          !tagsToRemoveLower.some(t => t.includes('nipple'))) {
        tagsToAdd.push('Nipple Play');
      }

      // Bareback - STRICT
      const hasAnal = text.includes('anal') || text.includes('backdoor') || text.includes('ass fuck');
      const hasBare = text.includes('bare') || text.includes('raw') || text.includes('without condom');
      if (hasAnal && hasBare &&
          !currentTagsLower.includes('bareback') && !tagsToRemoveLower.includes('bareback')) {
        tagsToAdd.push('Bareback');
      }

      // Apply updates if needed
      if (tagsToRemove.length > 0 || tagsToAdd.length > 0) {
        const newTags = currentTags
          .filter(t => !tagsToRemove.includes(t))
          .concat(tagsToAdd);

        await base44.asServiceRole.entities.Video.update(video.id, {
          tags: newTags
        });

        videosUpdated++;
        totalTagsRemoved += tagsToRemove.length;
        totalTagsAdded += tagsToAdd.length;

        updateLog.push({
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          tagsRemoved: tagsToRemove,
          tagsAdded: tagsToAdd,
          newTags: newTags
        });
      }
    }

    return Response.json({
      execution: {
        videosUpdated,
        tagsRemoved: totalTagsRemoved,
        tagsAdded: totalTagsAdded,
        totalChanges: totalTagsRemoved + totalTagsAdded
      },
      updateLog
    });

  } catch (error) {
    console.error('Tag execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});