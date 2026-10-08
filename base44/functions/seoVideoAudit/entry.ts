import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all videos (asServiceRole returns flat objects, no .data wrapper)
    const allVideos = await base44.asServiceRole.entities.Video.list();
    const allPerformers = await base44.asServiceRole.entities.Performer.list();
    const allBrands = await base44.asServiceRole.entities.Brand.list();
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.list();

    // Create lookup maps
    const performerMap = new Map();
    allPerformers.forEach(p => {
      performerMap.set(p.id, p);
    });
    
    const brandMap = new Map();
    allBrands.forEach(b => {
      brandMap.set(b.id, b);
    });
    
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

    // Analyze each video
    const analysis = allVideos.map(video => {
      const videoId = video.id;
      
      // Get linked performers
      const vpList = videoPerformerMap.get(videoId) || [];
      const performerNames = vpList.map(vp => {
        const perf = performerMap.get(vp.performer_id);
        return perf ? perf.display_name : null;
      }).filter(Boolean);
      
      // Get brand
      const brand = brandMap.get(video.brand_id);
      
      // Check readiness criteria
      const issues = [];
      const strengths = [];
      
      // Status check
      if (video.status !== 'published') {
        issues.push('Not published (status: ' + video.status + ')');
      } else {
        strengths.push('Published');
      }
      
      // Slug check
      if (!video.slug || video.slug.length < 5) {
        issues.push('Missing/invalid slug');
      } else if (video.slug.length > 100) {
        issues.push('Slug too long (' + video.slug.length + ' chars)');
      } else {
        strengths.push('Valid slug');
      }
      
      // Title check
      if (!video.title || video.title.trim().length < 10) {
        issues.push('Missing/weak title');
      } else if (video.title.length > 120) {
        issues.push('Title too long (' + video.title.length + ' chars)');
      } else {
        strengths.push('Good title (' + video.title.length + ' chars)');
      }
      
      // Meta title
      if (!video.meta_title || video.meta_title.trim().length < 10) {
        issues.push('Missing meta title');
      } else {
        strengths.push('Has meta title');
      }
      
      // Meta description
      if (!video.meta_description || video.meta_description.trim().length < 50) {
        issues.push('Missing/weak meta description');
      } else {
        strengths.push('Has meta description');
      }
      
      // Short summary
      if (!video.short_summary || video.short_summary.trim().length < 20) {
        issues.push('Missing short summary');
      } else {
        strengths.push('Has short summary');
      }
      
      // Description
      if (!video.description || video.description.trim().length < 50) {
        issues.push('Missing/weak description');
      } else {
        strengths.push('Has description (' + video.description.length + ' chars)');
      }
      
      // Duration
      if (!video.duration_seconds || video.duration_seconds <= 0) {
        issues.push('Missing/invalid duration');
      } else {
        strengths.push('Has duration (' + video.duration_seconds + 's)');
      }
      
      // Thumbnail
      if (!video.primary_thumbnail_url) {
        issues.push('Missing thumbnail');
      } else {
        strengths.push('Has thumbnail');
      }
      
      // Tags
      if (!video.tags || video.tags.length === 0) {
        issues.push('No tags');
      } else {
        strengths.push('Has ' + video.tags.length + ' tags');
      }
      
      // Categories
      if (!video.categories || video.categories.length === 0) {
        issues.push('No categories');
      } else {
        strengths.push('Has ' + video.categories.length + ' categories');
      }
      
      // Performers
      if (performerNames.length === 0) {
        issues.push('No linked performers');
      } else {
        strengths.push(performerNames.length + ' performer(s) linked: ' + performerNames.join(', '));
      }
      
      // Brand
      if (!brand) {
        issues.push('No brand');
      } else {
        strengths.push('Brand: ' + (brand.name || 'Unknown'));
      }
      
      // Determine readiness status
      let readinessStatus = 'READY';
      
      // CRITICAL blockers - should not index
      if (video.status !== 'published' || !video.primary_thumbnail_url || !video.duration_seconds) {
        readinessStatus = 'SHOULD_NOT_INDEX';
      } else if (issues.length > 4) {
        readinessStatus = 'NEEDS_METADATA';
      } else if (issues.length > 2) {
        readinessStatus = 'READY_WITH_ISSUES';
      }
      
      // Generate recommendations
      const recommendations = {
        seo_title: video.meta_title || (video.title ? video.title + ' | FLESHLAB Studios' : null),
        seo_description: video.meta_description || video.short_summary || (video.description ? video.description.substring(0, 150) + '...' : null),
        suggested_tags: video.tags || [],
        suggested_category: video.categories?.[0] || 'Solo'
      };

      return {
        video_id: videoId,
        title: video.title,
        slug: video.slug,
        status: video.status,
        short_summary: video.short_summary ? video.short_summary.substring(0, 100) : null,
        description_length: video.description?.length || 0,
        meta_title: video.meta_title,
        meta_description: video.meta_description,
        tags_count: video.tags?.length || 0,
        categories: video.categories || [],
        duration_seconds: video.duration_seconds,
        thumbnail_url: video.primary_thumbnail_url,
        has_trailer: !!video.trailer_url,
        has_preview: !!video.preview_gif_url,
        performers: performerNames,
        brand: brand?.name,
        access_tier: video.access_tier,
        published_at: video.published_at,
        created_date: video.created_date,
        readiness_status: readinessStatus,
        issues,
        strengths,
        recommendations,
        public_url: '/videos/' + video.slug
      };
    });

    // Categorize videos
    const readyVideos = analysis.filter(v => v.readiness_status === 'READY');
    const readyWithIssues = analysis.filter(v => v.readiness_status === 'READY_WITH_ISSUES');
    const needsMetadata = analysis.filter(v => v.readiness_status === 'NEEDS_METADATA');
    const shouldNotIndex = analysis.filter(v => v.readiness_status === 'SHOULD_NOT_INDEX');

    // Specific issue categories
    const missingDuration = analysis.filter(v => !v.duration_seconds);
    const missingThumbnails = analysis.filter(v => !v.thumbnail_url);
    const weakDescriptions = analysis.filter(v => v.description_length < 100);
    const noPerformers = analysis.filter(v => v.performers.length === 0);
    const missingMetaTitle = analysis.filter(v => !v.meta_title || v.meta_title.length < 10);
    const missingMetaDescription = analysis.filter(v => !v.meta_description || v.meta_description.length < 50);

    // Top 10 ready for indexing (once duration is fixed)
    const top10Ready = [...readyVideos, ...readyWithIssues]
      .sort((a, b) => b.strengths.length - a.strengths.length)
      .slice(0, 10);

    return Response.json({
      summary: {
        total_videos: analysis.length,
        ready_count: readyVideos.length,
        ready_with_issues_count: readyWithIssues.length,
        needs_metadata_count: needsMetadata.length,
        should_not_index_count: shouldNotIndex.length,
        missing_duration_count: missingDuration.length,
        missing_thumbnails_count: missingThumbnails.length,
        weak_descriptions_count: weakDescriptions.length,
        no_performers_count: noPerformers.length,
        missing_meta_title_count: missingMetaTitle.length,
        missing_meta_description_count: missingMetaDescription.length
      },
      top_10_ready: top10Ready,
      needs_metadata: needsMetadata,
      should_not_index: shouldNotIndex,
      all_videos: analysis
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});