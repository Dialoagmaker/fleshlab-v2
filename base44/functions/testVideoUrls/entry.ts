import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { video_id } = await req.json();
    const video = await base44.entities.Video.get(video_id);
    
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const urlsToTest = [
      { name: 'thumbnail', url: video.primary_thumbnail_url },
      { name: 'preview', url: video.trailer_url },
      { name: 'source', url: video.source_video_url },
    ];

    const results = [];
    for (const { name, url } of urlsToTest) {
      if (!url) {
        results.push({ name, status: 'missing', url: null });
        continue;
      }
      
      try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        results.push({
          name,
          status: response.ok ? '✅ accessible' : '❌ error',
          http_status: response.status,
          content_type: response.headers.get('content-type'),
          content_length: response.headers.get('content-length'),
          url: url,
          final_url: response.url,
        });
      } catch (err) {
        results.push({
          name,
          status: '❌ fetch_failed',
          error: err.message,
          url: url,
        });
      }
    }

    return Response.json({
      video_id: video.id,
      title: video.title,
      brand_id: video.brand_id,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});