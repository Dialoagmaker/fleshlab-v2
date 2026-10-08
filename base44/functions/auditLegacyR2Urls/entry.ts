import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all videos
    const allVideos = await base44.asServiceRole.entities.Video.list();
    
    const legacyUrlPattern = /r2\.dev/i;
    const videosWithLegacyUrls = [];
    
    // Check each video for legacy R2 URLs
    for (const video of allVideos) {
      const legacyFields = [];
      
      const fieldsToCheck = [
        { name: 'primary_thumbnail_url', value: video.primary_thumbnail_url },
        { name: 'trailer_url', value: video.trailer_url },
        { name: 'source_video_url', value: video.source_video_url },
        { name: 'cover_image_url', value: video.cover_image_url },
        { name: 'preview_gif_url', value: video.preview_gif_url },
      ];
      
      fieldsToCheck.forEach(field => {
        if (field.value && legacyUrlPattern.test(field.value)) {
          legacyFields.push({
            field: field.name,
            old_url: field.value,
          });
        }
      });
      
      if (legacyFields.length > 0) {
        videosWithLegacyUrls.push({
          id: video.id,
          title: video.title,
          slug: video.slug,
          status: video.status,
          brand_id: video.brand_id,
          legacy_fields: legacyFields,
        });
      }
    }
    
    // Test URLs for each affected video
    const detailedResults = [];
    
    for (const videoData of videosWithLegacyUrls.slice(0, 50)) { // Limit to 50 for performance
      const result = {
        ...videoData,
        tested_urls: []
      };
      
      for (const legacyField of videoData.legacy_fields) {
        const oldUrl = legacyField.old_url;
        
        // Try to construct canonical URL
        let canonicalUrl = oldUrl;
        if (oldUrl.includes('pub-') && oldUrl.includes('r2.dev')) {
          // Extract path from R2 URL: pub-xxx.r2.dev/studios/brand-id/... -> video.fleshlab.online/studios/brand-id/...
          const pathMatch = oldUrl.match(/r2\.dev\/(.+)$/);
          if (pathMatch) {
            canonicalUrl = `https://video.fleshlab.online/${pathMatch[1]}`;
          }
        }
        
        // Test old URL
        let oldUrlStatus = { url: oldUrl, type: 'legacy', accessible: false, http_status: null };
        try {
          const oldResp = await fetch(oldUrl, { method: 'HEAD', redirect: 'follow' });
          oldUrlStatus.http_status = oldResp.status;
          oldUrlStatus.accessible = oldResp.ok;
          oldUrlStatus.content_type = oldResp.headers.get('content-type');
          oldUrlStatus.content_length = oldResp.headers.get('content-length');
        } catch (e) {
          oldUrlStatus.error = e.message;
        }
        
        // Test canonical URL
        let canonicalUrlStatus = { url: canonicalUrl, type: 'canonical', accessible: false, http_status: null };
        if (canonicalUrl !== oldUrl) {
          try {
            const canonResp = await fetch(canonicalUrl, { method: 'HEAD', redirect: 'follow' });
            canonicalUrlStatus.http_status = canonResp.status;
            canonicalUrlStatus.accessible = canonResp.ok;
            canonicalUrlStatus.content_type = canonResp.headers.get('content-type');
            canonicalUrlStatus.content_length = canonResp.headers.get('content-length');
          } catch (e) {
            canonicalUrlStatus.error = e.message;
          }
        }
        
        result.tested_urls.push({
          field: legacyField.field,
          old_url_status: oldUrlStatus,
          canonical_url_status: canonicalUrlStatus,
          should_migrate: canonicalUrlStatus.accessible && !oldUrlStatus.accessible,
        });
      }
      
      detailedResults.push(result);
    }
    
    return Response.json({
      total_videos_scanned: allVideos.length,
      videos_with_legacy_urls: videosWithLegacyUrls.length,
      detailed_results: detailedResults,
      summary: `Found ${videosWithLegacyUrls.length} videos with legacy R2 URLs out of ${allVideos.length} total videos`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});