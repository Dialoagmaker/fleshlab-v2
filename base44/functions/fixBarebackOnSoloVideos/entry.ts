import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fix remaining bareback tags on solo videos
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      1000
    );

    let fixed = 0;
    const fixLog = [];

    for (const video of allVideos) {
      const currentTags = video.tags || [];
      const text = `${video.title || ''} ${video.description || ''}`.toLowerCase();
      
      // Check for bareback tags on solo videos
      const barebackTags = currentTags.filter(t => 
        t.toLowerCase().includes('bareback')
      );

      if (barebackTags.length > 0) {
        const hasAnal = text.includes('anal') || text.includes('backdoor') || text.includes('ass fuck');
        const hasBare = text.includes('bare') || text.includes('raw') || text.includes('without condom');
        
        // Remove bareback tags if no anal+bare described
        if (!hasAnal || !hasBare) {
          const newTags = currentTags.filter(t => !t.toLowerCase().includes('bareback'));
          
          await base44.asServiceRole.entities.Video.update(video.id, {
            tags: newTags
          });

          fixed++;
          fixLog.push({
            video_id: video.id,
            title: video.title,
            tagsRemoved: barebackTags,
            newTags
          });
        }
      }
    }

    return Response.json({
      fixed,
      fixLog
    });

  } catch (error) {
    console.error('Bareback fix error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});