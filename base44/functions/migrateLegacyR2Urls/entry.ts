import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allVideos = await base44.asServiceRole.entities.Video.list();
    const legacyUrlPattern = /r2\.dev/i;
    
    // Find videos with legacy URLs
    const affectedVideos = allVideos.filter(v => 
      [v.primary_thumbnail_url, v.trailer_url, v.source_video_url, v.cover_image_url, v.preview_gif_url]
        .some(url => url && legacyUrlPattern.test(url))
    );
    
    // Test first 10 in detail
    const sample = affectedVideos.slice(0, 10);
    const testResults = [];
    
    for (const video of sample) {
      const result = {
        id: video.id,
        title: video.title,
        fields: {}
      };
      
      const testUrl = async (fieldName, url) => {
        if (!url) return null;
        
        // Build canonical URL
        let canonicalUrl = url;
        if (url.includes('r2.dev')) {
          const match = url.match(/r2\.dev\/(.+)$/);
          if (match) {
            canonicalUrl = `https://video.fleshlab.online/${match[1]}`;
          }
        }
        
        // Test both
        const [legacyResp, canonResp] = await Promise.all([
          fetch(url, { method: 'HEAD' }).catch(e => ({ status: 0, error: e.message })),
          fetch(canonicalUrl, { method: 'HEAD' }).catch(e => ({ status: 0, error: e.message }))
        ]);
        
        return {
          field: fieldName,
          legacy_url: url,
          legacy_status: legacyResp.status,
          canonical_url: canonicalUrl,
          canonical_status: canonResp.status,
          migrate: canonResp.status === 200
        };
      };
      
      result.fields.thumbnail = await testUrl('primary_thumbnail_url', video.primary_thumbnail_url);
      result.fields.trailer = await testUrl('trailer_url', video.trailer_url);
      result.fields.source = await testUrl('source_video_url', video.source_video_url);
      
      testResults.push(result);
    }
    
    return Response.json({
      total_videos: allVideos.length,
      videos_with_legacy_urls: affectedVideos.length,
      sample_test_results: testResults,
      migration_needed: affectedVideos.length > 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});