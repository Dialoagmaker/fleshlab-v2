import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Final cleanup - remove all spam tags and unsupported oral tags
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const videoId = '6a1c2c02a6588ed93755fff3';
    const video = await base44.asServiceRole.entities.Video.get(videoId);
    
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const currentTags = video.tags || [];
    
    // Remove ALL spam SEO tags and unsupported sex act tags
    const spamPatterns = [
      'free porn', 'adult toys', 'best porn sites', 
      'adult movie downloads', 'adult videos', 'X-rated videos',
      'fleshlight reviews', 'buy fleshlight online', 
      'best male masturbation devices', 'lube for fleshlights',
      'best fleshlights', 'gay twink', 'twinks cumshot',
      'gay cum compilation', 'twink sex videos', 'twink tube',
      'amateur gay twinks', 'twink anal', 'best gay porn sites',
      'blowjob', 'oral'  // Remove these tags - no evidence
    ];
    
    const newTags = currentTags.filter(t => 
      !spamPatterns.some(spam => t.toLowerCase().includes(spam.toLowerCase()))
    );

    await base44.asServiceRole.entities.Video.update(videoId, {
      tags: newTags
    });

    return Response.json({
      message: 'Final cleanup complete - all spam tags removed',
      video_id: videoId,
      title: video.title,
      oldTags: currentTags,
      newTags,
      removed: currentTags.filter(t => !newTags.includes(t))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});