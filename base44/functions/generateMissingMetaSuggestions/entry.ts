import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all videos
    const allVideos = await base44.asServiceRole.entities.Video.list();
    const allPerformers = await base44.asServiceRole.entities.Performer.list();
    const allBrands = await base44.asServiceRole.entities.Brand.list();
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.list();

    // Create lookup maps
    const performerMap = new Map();
    allPerformers.forEach(p => performerMap.set(p.id, p));
    
    const brandMap = new Map();
    allBrands.forEach(b => brandMap.set(b.id, b));
    
    // Map video performers
    const videoPerformerMap = new Map();
    videoPerformers.forEach(vp => {
      const videoId = vp.video_id;
      if (!videoId) return;
      if (!videoPerformerMap.has(videoId)) {
        videoPerformerMap.set(videoId, []);
      }
      videoPerformerMap.get(videoId).push({
        performer_id: vp.performer_id,
        role: vp.role,
        lead: vp.lead_performer
      });
    });

    // Filter videos missing meta_title OR meta_description
    const missingMetadata = allVideos
      .filter(v => 
        !v.meta_title || v.meta_title.trim().length < 10 ||
        !v.meta_description || v.meta_description.trim().length < 50
      )
      .map(video => {
        const vpList = videoPerformerMap.get(video.id) || [];
        const performerNames = vpList.map(vp => {
          const perf = performerMap.get(vp.performer_id);
          return perf ? perf.display_name : null;
        }).filter(Boolean);
        
        const brand = brandMap.get(video.brand_id);
        
        // Generate meta title suggestion (50-60 chars)
        let suggestedMetaTitle = '';
        if (performerNames.length > 0) {
          // Format: "[Performer] [Action] | FLESHLAB" 
          const baseTitle = `${performerNames[0]} ${video.title.substring(0, 35)}`;
          suggestedMetaTitle = baseTitle.length > 50 
            ? `${baseTitle.substring(0, 47)}... | FLESHLAB`
            : `${baseTitle} | FLESHLAB`;
        } else {
          // No performer - use title + brand
          const baseTitle = `${video.title.substring(0, 40)} | ${brand?.name || 'FLESHLAB'}`;
          suggestedMetaTitle = baseTitle.length > 55 
            ? `${video.title.substring(0, 52)}... | FLESHLAB`
            : baseTitle;
        }
        
        // Ensure 50-60 chars
        if (suggestedMetaTitle.length < 50) {
          suggestedMetaTitle = suggestedMetaTitle.padEnd(50, ' ');
        }
        if (suggestedMetaTitle.length > 60) {
          suggestedMetaTitle = suggestedMetaTitle.substring(0, 57) + '...';
        }
        
        // Generate meta description suggestion (150-160 chars)
        let suggestedMetaDescription = '';
        
        // Use short_summary if available, otherwise first part of description
        const baseText = video.short_summary || video.description || '';
        
        // Extract key themes from tags
        const tagKeywords = video.tags?.slice(0, 3).join(', ') || '';
        
        // Build description: [Action description]. [Performer/brand context]. [Tags].
        const truncatedText = baseText.substring(0, 120).replace(/\n/g, ' ');
        suggestedMetaDescription = `${truncatedText} ${performerNames.length > 0 ? 'Starring ' + performerNames.join(', ') + '. ' : ''}${tagKeywords ? 'Tags: ' + tagKeywords + '.' : ''}`;
        
        // Ensure 150-160 chars
        if (suggestedMetaDescription.length < 150) {
          suggestedMetaDescription = suggestedMetaDescription + ' Watch now on FLESHLAB Studios.'.padEnd(150 - suggestedMetaDescription.length, ' ');
        }
        if (suggestedMetaDescription.length > 160) {
          suggestedMetaDescription = suggestedMetaDescription.substring(0, 157) + '...';
        }
        
        return {
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          brand_name: brand?.name || 'Unknown',
          performers: performerNames,
          current_meta_title: video.meta_title || null,
          current_meta_description: video.meta_description || null,
          suggested_meta_title: suggestedMetaTitle,
          suggested_meta_title_length: suggestedMetaTitle.length,
          suggested_meta_description: suggestedMetaDescription,
          suggested_meta_description_length: suggestedMetaDescription.length,
          tags_used: video.tags?.slice(0, 5) || [],
          categories: video.categories || [],
          admin_edit_url: '/admin/videos/' + video.id,
          public_url: '/videos/' + video.slug
        };
      });

    return Response.json({
      count: missingMetadata.length,
      videos: missingMetadata
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});