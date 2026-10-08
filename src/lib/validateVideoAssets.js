import { base44 } from "@/api/base44Client";

/**
 * Diagnostic utility to validate video asset URLs
 * Returns detailed status for admin debugging
 */
export async function validateVideoAssetUrls(videoId) {
  try {
    const video = await base44.entities.Video.get(videoId);
    if (!video) {
      return { error: 'Video not found' };
    }

    const assets = await base44.entities.VideoAsset.filter({ video_id: videoId });
    
    const results = {
      video_id: videoId,
      video_title: video.title,
      entity_urls: {
        primary_thumbnail_url: video.primary_thumbnail_url,
        trailer_url: video.trailer_url,
        source_video_url: video.source_video_url,
        cover_image_url: video.cover_image_url,
        preview_gif_url: video.preview_gif_url,
      },
      assets: assets.map(a => ({
        id: a.id,
        asset_type: a.asset_type,
        status: a.status,
        cdn_url: a.cdn_url,
        r2_key: a.r2_key,
      })),
      url_tests: {},
    };

    // Test each URL with HEAD request
    const urlsToTest = [
      { name: 'thumbnail', url: video.primary_thumbnail_url },
      { name: 'preview', url: video.trailer_url },
      { name: 'source', url: video.source_video_url },
    ];

    for (const { name, url } of urlsToTest) {
      if (!url) {
        results.url_tests[name] = { status: 'missing', url: null };
        continue;
      }

      try {
        const response = await fetch(url, { method: 'HEAD' });
        results.url_tests[name] = {
          status: response.ok ? 'accessible' : 'failed',
          http_status: response.status,
          content_type: response.headers.get('content-type'),
          content_length: response.headers.get('content-length'),
          url,
        };
      } catch (error) {
        results.url_tests[name] = {
          status: 'error',
          error: error.message,
          url,
        };
      }
    }

    return results;
  } catch (error) {
    return { error: error.message };
  }
}