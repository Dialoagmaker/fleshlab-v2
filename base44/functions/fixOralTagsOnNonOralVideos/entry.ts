import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fix remaining oral/blowjob tags on videos without oral content
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
      const categories = (video.categories || []).map(c => c.toLowerCase()).join(' ');
      
      // Check for oral/blowjob tags
      const oralTags = currentTags.filter(t => 
        t.toLowerCase().includes('blowjob') || t.toLowerCase().includes('oral')
      );

      if (oralTags.length > 0) {
        const hasOral = text.includes('blow') || text.includes('suck') || 
                       text.includes('oral') || text.includes('throat') ||
                       categories.includes('oral');
        
        // Remove oral tags if no oral described
        if (!hasOral) {
          const newTags = currentTags.filter(t => 
            !t.toLowerCase().includes('blowjob') && !t.toLowerCase().includes('oral')
          );
          
          await base44.asServiceRole.entities.Video.update(video.id, {
            tags: newTags
          });

          fixed++;
          fixLog.push({
            video_id: video.id,
            title: video.title,
            tagsRemoved: oralTags,
            newTags,
            reason: 'No oral/blowjob content described'
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