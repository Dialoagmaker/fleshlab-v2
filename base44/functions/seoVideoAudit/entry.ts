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
    const performerMap = new Map(allPerformers.map(p => [p.id || p._id, p.data || p]));
    const brandMap = new Map(allBrands.map(b => [b.id || b._id, b.data || b]));
    
    // Map video performers
    const videoPerformerMap = new Map();
    videoPerformers.forEach(vp => {
      const videoId = vp.data?.video_id;
      if (!videoId) return;
      if (!videoPerformerMap.has(videoId)) {
        videoPerformerMap.set(videoId, []);
      }
      videoPerformerMap.get(videoId).push({
        performer_id: vp.data.performer_id,
        role: vp.data.role,
        lead: vp.data.lead_performer
      });
    });

    // Analyze each video
    const analysis = allVideos.map(video => {
      const data = video.data || video._data || {};
      const videoId = video.id || video._id;
      const vpList = videoPerformerMap.get(videoId) || [];
      const performers = vpList.map(vp => {
        const perf = performerMap.get(vp.performer_id);
        return perf ? (perf.data || perf) : null;
      }).filter(Boolean);
      const brandRecord = brandMap.get(data.brand_id);
      const brand = brandRecord ? (brandRecord.data || brandRecord) : null;
      
      // Check readiness criteria
      const issues = [];
      const strengths = [];
      
      // Status check
      if (data.status !== 'published') {
        issues.push('Not published');
      } else {
        strengths.push('Published');
      }
      
      // Slug check
      if (!data.slug || data.slug.length < 5) {
        issues.push('Missing/invalid slug');
      } else if (data.slug.length > 100) {
        issues.push('Slug too long');
      } else {
        strengths.push('Valid slug');
      }
      
      // Title check
      if (!data.title || data.title.trim().length < 10) {
        issues.push('Missing/weak title');
      } else if (data.title.length > 120) {
        issues.push('Title too long');
      } else {
        strengths.push('Good title');
      }
      
      // Meta title
      if (!data.meta_title || data.meta_title.trim().length < 10) {
        issues.push('Missing meta title');
      } else {
        strengths.push('Has meta title');
      }
      
      // Meta description
      if (!data.meta_description || data.meta_description.trim().length < 50) {
        issues.push('Missing/weak meta description');
      } else {
        strengths.push('Has meta description');
      }
      
      // Short summary
      if (!data.short_summary || data.short_summary.trim().length < 20) {
        issues.push('Missing short summary');
      } else {
        strengths.push('Has short summary');
      }
      
      // Description
      if (!data.description || data.description.trim().length < 50) {
        issues.push('Missing/weak description');
      } else {
        strengths.push('Has description');
      }
      
      // Duration
      if (!data.duration_seconds || data.duration_seconds <= 0) {
        issues.push('Missing/invalid duration');
      } else {
        strengths.push('Has duration');
      }
      
      // Thumbnail
      if (!data.primary_thumbnail_url) {
        issues.push('Missing thumbnail');
      } else {
        strengths.push('Has thumbnail');
      }
      
      // Tags/Categories
      if (!data.tags || data.tags.length === 0) {
        issues.push('No tags');
      } else {
        strengths.push(`Has ${data.tags.length} tags`);
      }
      
      if (!data.categories || data.categories.length === 0) {
        issues.push('No categories');
      } else {
        strengths.push(`Has ${data.categories.length} categories`);
      }
      
      // Performers
      if (performers.length === 0) {
        issues.push('No linked performers');
      } else {
        strengths.push(`${performers.length} performer(s) linked`);
      }
      
      // Brand
      if (!brand) {
        issues.push('No brand');
      } else {
        strengths.push(`Brand: ${brand.data.name}`);
      }
      
      // Determine status
      let readinessStatus = 'READY';
      if (issues.length > 3 || data.status !== 'published' || !data.primary_thumbnail_url || !data.duration_seconds) {
        readinessStatus = 'NEEDS_METADATA';
      }
      if (issues.length > 6 || !data.description || data.status !== 'published') {
        readinessStatus = 'SHOULD_NOT_INDEX';
      }

      // Generate recommendations
      const recommendations = {
        seo_title: data.meta_title || data.title || `Watch ${data.title || 'Video'} | FLESHLAB Studios`,
        seo_description: data.meta_description || data.short_summary || data.description?.substring(0, 150) || '',
        suggested_tags: data.tags || [],
        suggested_category: data.categories?.[0] || 'Solo'
      };

      return {
        video_id: videoId,
        title: data.title,
        slug: data.slug,
        status: data.status,
        short_summary: data.short_summary?.substring(0, 100),
        description_length: data.description?.length || 0,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        tags_count: data.tags?.length || 0,
        categories: data.categories || [],
        duration_seconds: data.duration_seconds,
        thumbnail_url: data.primary_thumbnail_url,
        has_trailer: !!data.trailer_url,
        has_preview: !!data.preview_gif_url,
        performers: performers.map(p => p.display_name || p.data?.display_name).filter(Boolean),
        brand: brand?.name || brand?.data?.name,
        access_tier: data.access_tier,
        published_at: data.published_at,
        created_date: video.created_date,
        readiness_status: readinessStatus,
        issues,
        strengths,
        recommendations
      };
    });

    // Categorize videos
    const readyVideos = analysis.filter(v => v.readiness_status === 'READY');
    const needsMetadata = analysis.filter(v => v.readiness_status === 'NEEDS_METADATA');
    const shouldNotIndex = analysis.filter(v => v.readiness_status === 'SHOULD_NOT_INDEX');

    // Specific issue categories
    const missingDuration = analysis.filter(v => !v.duration_seconds);
    const missingThumbnails = analysis.filter(v => !v.thumbnail_url);
    const weakDescriptions = analysis.filter(v => v.description_length < 100);
    const noPerformers = analysis.filter(v => v.performers.length === 0);

    // Top 10 ready for indexing (prioritize by completeness)
    const top10Ready = readyVideos
      .sort((a, b) => b.strengths.length - a.strengths.length)
      .slice(0, 10);

    return Response.json({
      summary: {
        total_videos: analysis.length,
        ready_count: readyVideos.length,
        needs_metadata_count: needsMetadata.length,
        should_not_index_count: shouldNotIndex.length,
        missing_duration_count: missingDuration.length,
        missing_thumbnails_count: missingThumbnails.length,
        weak_descriptions_count: weakDescriptions.length,
        no_performers_count: noPerformers.length
      },
      top_10_ready: top10Ready,
      needs_metadata: needsMetadata,
      should_not_index: shouldNotIndex,
      all_videos: analysis
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});