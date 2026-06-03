import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allVideos = await base44.asServiceRole.entities.Video.list();
    const allPerformers = await base44.asServiceRole.entities.Performer.list();
    const allBrands = await base44.asServiceRole.entities.Brand.list();
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.list();

    const performerMap = new Map();
    allPerformers.forEach(p => performerMap.set(p.id, p));
    
    const brandMap = new Map();
    allBrands.forEach(b => brandMap.set(b.id, b));
    
    const videoPerformerMap = new Map();
    videoPerformers.forEach(vp => {
      if (!vp.video_id) return;
      if (!videoPerformerMap.has(vp.video_id)) {
        videoPerformerMap.set(vp.video_id, []);
      }
      videoPerformerMap.get(vp.video_id).push(vp);
    });

    // PART 1: 13 videos missing duration
    const missingDuration = allVideos
      .filter(v => !v.duration_seconds || v.duration_seconds <= 0)
      .map((video, idx) => {
        const vpList = videoPerformerMap.get(video.id) || [];
        const performerNames = vpList.map(vp => {
          const perf = performerMap.get(vp.performer_id);
          return perf ? perf.display_name : null;
        }).filter(Boolean);
        
        const brand = brandMap.get(video.brand_id);
        
        let fixClass = 'C', fixNotes = 'Manual entry required';
        if (video.source_video_url) { fixClass = 'A'; fixNotes = 'Full video available - auto-extract possible'; }
        else if (video.trailer_url) { fixClass = 'B'; fixNotes = 'Only trailer - manual or locate source'; }
        
        return {
          "#": idx + 1,
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          brand: brand?.name || 'Unknown',
          performers: performerNames.join(', '),
          duration: video.duration_seconds,
          source_url: video.source_video_url || null,
          trailer_url: video.trailer_url || null,
          preview_url: video.preview_gif_url || null,
          fix_class: fixClass,
          fix_notes: fixNotes,
          admin_url: '/admin/videos/' + video.id,
          public_url: '/videos/' + video.slug
        };
      });

    // PART 2: 6 videos missing metadata
    const missingMeta = allVideos
      .filter(v => !v.meta_title || v.meta_title.length < 10 || !v.meta_description || v.meta_description.length < 50)
      .map((video, idx) => {
        const vpList = videoPerformerMap.get(video.id) || [];
        const performerNames = vpList.map(vp => {
          const perf = performerMap.get(vp.performer_id);
          return perf ? perf.display_name : null;
        }).filter(Boolean);
        
        const brand = brandMap.get(video.brand_id);
        const p1 = performerNames[0] || '';
        const p2 = performerNames[1] || '';
        const hasCP = video.tags?.some(t => t.toLowerCase().includes('creampie'));
        const hasSolo = video.categories?.some(c => c.toLowerCase() === 'solo');
        const hasAsian = video.categories?.some(c => c.toLowerCase().includes('asian'));
        
        let metaTitle = '';
        if (p1 && !p2) {
          metaTitle = `${p1} ${hasAsian ? 'Asian' : ''} ${hasCP ? 'Creampie' : hasSolo ? 'Solo' : 'Hot'} Scene | FLESHLAB`;
        } else if (p1 && p2) {
          metaTitle = `${p1} & ${p2} ${hasCP ? 'Creampie' : 'Hot'} Scene | FLESHLAB`;
        } else {
          metaTitle = `${video.title.substring(0, 45)} | FLESHLAB`;
        }
        if (metaTitle.length > 60) metaTitle = metaTitle.substring(0, 57) + '...';
        
        const baseText = video.short_summary || (video.description || '').substring(0, 100).replace(/\n/g, ' ');
        const perfCtx = performerNames.length ? `Starring ${performerNames.join(', ')}. ` : '';
        const brandCtx = brand?.name ? `from ${brand.name}.` : '';
        let metaDesc = `${baseText} ${perfCtx}${brandCtx}`.trim();
        if (metaDesc.length > 160) metaDesc = metaDesc.substring(0, 157) + '...';
        
        return {
          "#": idx + 1,
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          performers: performerNames.join(', '),
          tags: (video.tags || []).slice(0, 5).join(', '),
          categories: (video.categories || []).slice(0, 3).join(', '),
          description_preview: (video.description || 'N/A').substring(0, 80) + '...',
          short_summary: video.short_summary || 'N/A',
          suggested_meta_title: metaTitle,
          suggested_meta_title_len: metaTitle.length,
          suggested_meta_description: metaDesc,
          suggested_meta_description_len: metaDesc.length,
          admin_url: '/admin/videos/' + video.id
        };
      });

    return Response.json({
      part1_missing_duration: {
        count: missingDuration.length,
        class_a: missingDuration.filter(v => v.fix_class === 'A').length,
        class_b: missingDuration.filter(v => v.fix_class === 'B').length,
        class_c: missingDuration.filter(v => v.fix_class === 'C').length,
        videos: missingDuration
      },
      part2_missing_metadata: {
        count: missingMeta.length,
        videos: missingMeta
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});