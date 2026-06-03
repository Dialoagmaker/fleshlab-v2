import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fix remaining oral/blowjob tags on videos without oral content evidence
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Specific videos that still have oral tags without evidence
    const targetVideoIds = [
      '6a1c2c0d75163d4961f1a086', // Horny Cuban Twink Strips Naked
      '6a1c2c02a6588ed93755fff3'  // Watch Hot Asian Man Cumming Compilation
    ];

    let fixed = 0;
    const fixLog = [];

    for (const videoId of targetVideoIds) {
      const video = await base44.asServiceRole.entities.Video.get(videoId);
      if (!video) continue;

      const currentTags = video.tags || [];
      const text = `${video.title || ''} ${video.description || ''} ${video.short_summary || ''}`.toLowerCase();
      
      // Check for oral/blowjob tags
      const oralTags = currentTags.filter(t => 
        t.toLowerCase().includes('blowjob') || t.toLowerCase().includes('oral')
      );

      if (oralTags.length > 0) {
        const hasOral = text.includes('blow') || text.includes('suck') || 
                       text.includes('oral') || text.includes('throat') ||
                       (video.categories || []).some(c => c.toLowerCase().includes('oral'));
        
        // Remove oral tags if no oral described
        if (!hasOral) {
          const newTags = currentTags.filter(t => 
            !t.toLowerCase().includes('blowjob') && !t.toLowerCase().includes('oral')
          );
          
          await base44.asServiceRole.entities.Video.update(videoId, {
            tags: newTags
          });

          fixed++;
          fixLog.push({
            video_id: videoId,
            title: video.title,
            tagsRemoved: oralTags,
            newTags,
            reason: 'No oral/blowjob content evidence in title/description/categories'
          });
        }
      }
    }

    return Response.json({
      fixed,
      fixLog
    });

  } catch (error) {
    console.error('Oral tag fix error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});