import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, videoIds, override } = await req.json();

    // Fetch all videos
    const videos = await base44.entities.Video.list();
    const brands = await base44.entities.Brand.list();

    // Analyze metadata gaps
    const analysis = videos.map(video => {
      const brand = brands.find(b => b.id === video.brand_id);
      const issues = [];
      const needsGeneration = {};

      // Check meta_title
      if (!video.meta_title || video.meta_title.trim() === '') {
        issues.push('missing_meta_title');
        needsGeneration.meta_title = true;
      } else if (video.meta_title.length > 60) {
        issues.push('meta_title_too_long');
      }

      // Check meta_description
      if (!video.meta_description || video.meta_description.trim() === '') {
        issues.push('missing_meta_description');
        needsGeneration.meta_description = true;
      } else {
        const len = video.meta_description.length;
        if (len < 120 || len > 158) {
          issues.push('meta_description_wrong_length');
        }
      }

      // Check short_summary
      if (!video.short_summary || video.short_summary.trim() === '') {
        issues.push('missing_short_summary');
        needsGeneration.short_summary = true;
      } else if (video.short_summary.length > 120) {
        issues.push('short_summary_too_long');
      }

      // Check release_date
      if (!video.release_date) {
        issues.push('missing_release_date');
        needsGeneration.release_date = true;
      }

      // Check duration_seconds
      if (!video.duration_seconds) {
        issues.push('missing_duration');
        needsGeneration.duration = true;
      }

      return {
        video_id: video.id,
        video_title: video.title,
        video_slug: video.slug,
        brand_name: brand?.name || 'Unknown',
        issues,
        needsGeneration,
        hasMultipleIssues: issues.length > 1,
        current: {
          meta_title: video.meta_title,
          meta_description: video.meta_description,
          short_summary: video.short_summary,
          release_date: video.release_date,
          duration_seconds: video.duration_seconds,
        }
      };
    });

    // Filter to videos with issues
    const videosWithIssues = analysis.filter(a => a.issues.length > 0);

    // Summary stats
    const stats = {
      total_videos: videos.length,
      videos_with_issues: videosWithIssues.length,
      videos_complete: videos.length - videosWithIssues.length,
      missing_meta_title: analysis.filter(a => a.needsGeneration.meta_title).length,
      missing_meta_description: analysis.filter(a => a.needsGeneration.meta_description).length,
      missing_short_summary: analysis.filter(a => a.needsGeneration.short_summary).length,
      missing_release_date: analysis.filter(a => a.needsGeneration.release_date).length,
      missing_duration: analysis.filter(a => a.needsGeneration.duration).length,
    };

    // If action is "analyze", return analysis only
    if (action === 'analyze') {
      return Response.json({
        stats,
        analysis: videosWithIssues,
        estimated_llm_calls: videosWithIssues.filter(v => 
          v.needsGeneration.meta_title || 
          v.needsGeneration.meta_description || 
          v.needsGeneration.short_summary
        ).length,
      });
    }

    // If action is "generate_preview", generate metadata for selected videos
    if (action === 'generate_preview') {
      const selectedVideos = videos.filter(v => videoIds?.includes(v.id));
      const previews = [];

      for (const video of selectedVideos) {
        const brand = brands.find(b => b.id === video.brand_id);
        const proposed = {};

        // Generate meta_title if missing
        if (!video.meta_title) {
          const baseTitle = video.title.split('|')[0].trim(); // Remove SEO spam after pipe
          const brandPart = brand ? ` | ${brand.name}` : '';
          const tagsPart = video.tags && video.tags.length > 0 ? ` - ${video.tags.slice(0, 2).join(', ')}` : '';
          proposed.meta_title = `${baseTitle}${brandPart}${tagsPart}`.slice(0, 60);
        }

        // Generate meta_description if missing
        if (!video.meta_description) {
          const desc = video.description || video.title;
          const brandPart = brand ? ` from ${brand.name}` : '';
          const tagsPart = video.tags && video.tags.length > 0 ? `. Tags: ${video.tags.slice(0, 3).join(', ')}` : '';
          const fullText = `Watch ${video.title}${brandPart}${tagsPart}. ${desc.slice(0, 80)}...`;
          proposed.meta_description = fullText.slice(0, 155) + (fullText.length > 155 ? '...' : '');
        }

        // Generate short_summary if missing
        if (!video.short_summary) {
          const baseText = video.description || video.title;
          const sentences = baseText.split(/[.!?]/).filter(s => s.trim().length > 0);
          proposed.short_summary = sentences[0]?.slice(0, 120).trim() || video.title.slice(0, 120);
        }

        // Set release_date if missing
        if (!video.release_date) {
          proposed.release_date = video.created_date ? new Date(video.created_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        }

        // Duration cannot be auto-generated without video analysis
        proposed.duration_seconds = null;
        proposed.duration_note = "Manual review required - cannot extract from URL";

        previews.push({
          video_id: video.id,
          video_title: video.title,
          video_slug: video.slug,
          current: {
            meta_title: video.meta_title,
            meta_description: video.meta_description,
            short_summary: video.short_summary,
            release_date: video.release_date,
            duration_seconds: video.duration_seconds,
          },
          proposed,
        });
      }

      return Response.json({ previews });
    }

    // If action is "apply", apply the changes
    if (action === 'apply') {
      const selectedVideos = videos.filter(v => videoIds?.includes(v.id));
      const applied = [];
      const errors = [];

      for (const video of selectedVideos) {
        try {
          const updates = {};
          const brand = brands.find(b => b.id === video.brand_id);

          // Only update if field is missing OR override=true
          if (!video.meta_title || override) {
            const baseTitle = video.title.split('|')[0].trim();
            const brandPart = brand ? ` | ${brand.name}` : '';
            const tagsPart = video.tags && video.tags.length > 0 ? ` - ${video.tags.slice(0, 2).join(', ')}` : '';
            updates.meta_title = `${baseTitle}${brandPart}${tagsPart}`.slice(0, 60);
          }

          if (!video.meta_description || override) {
            const desc = video.description || video.title;
            const brandPart = brand ? ` from ${brand.name}` : '';
            const tagsPart = video.tags && video.tags.length > 0 ? `. Tags: ${video.tags.slice(0, 3).join(', ')}` : '';
            const fullText = `Watch ${video.title}${brandPart}${tagsPart}. ${desc.slice(0, 80)}...`;
            updates.meta_description = fullText.slice(0, 155) + (fullText.length > 155 ? '...' : '');
          }

          if (!video.short_summary || override) {
            const baseText = video.description || video.title;
            const sentences = baseText.split(/[.!?]/).filter(s => s.trim().length > 0);
            updates.short_summary = sentences[0]?.slice(0, 120).trim() || video.title.slice(0, 120);
          }

          if (!video.release_date || override) {
            updates.release_date = video.created_date ? new Date(video.created_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          }

          // Don't auto-set duration - requires manual review
          // duration_seconds left unchanged

          if (Object.keys(updates).length > 0) {
            await base44.entities.Video.update(video.id, updates);
            applied.push({
              video_id: video.id,
              video_title: video.title,
              updates,
            });
          }
        } catch (error) {
          errors.push({
            video_id: video.id,
            video_title: video.title,
            error: error.message,
          });
        }
      }

      return Response.json({
        applied_count: applied.length,
        errors,
        applied,
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});