import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all published videos with missing or zero duration
    const allVideos = await base44.asServiceRole.entities.Video.filter({ status: 'published' });
    const videosNeedingDuration = allVideos.filter(v => 
      !v.duration_seconds || v.duration_seconds <= 0
    );

    if (videosNeedingDuration.length === 0) {
      return Response.json({
        summary: { total_checked: allVideos.length, needs_duration: 0, updated: 0, failed: 0 },
        message: 'All published videos have valid duration'
      });
    }

    // Initialize R2 client
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    const results = [];
    const errors = [];

    for (const video of videosNeedingDuration) {
      try {
        // Skip if no source video URL
        if (!video.source_video_url) {
          errors.push({
            video_id: video.id,
            title: video.title,
            slug: video.slug,
            error: 'No source_video_url - manual duration required',
            admin_url: `/admin/videos/${video.id}`
          });
          continue;
        }

        // Extract R2 key from source URL
        // Format: https://pub-xxx.r2.dev/studios/{studio}/videos/{filename}.ext
        const urlParts = video.source_video_url.split('/');
        const keyParts = urlParts.slice(3); // Remove protocol and domain
        const r2Key = keyParts.join('/');

        // Fetch video file from R2 (first 1MB should contain mvhd atom)
        const getCommand = new GetObjectCommand({
          Bucket: Deno.env.get('R2_BUCKET_NAME'),
          Key: r2Key,
          Range: 'bytes=0-1048576' // First 1MB
        });

        const response = await r2Client.send(getCommand);
        const arrayBuffer = await response.Body.transformToByteArray();
        
        // Extract duration from MP4/MOV container
        const duration = extractMp4Duration(arrayBuffer);
        
        if (duration && duration > 0) {
          // Update the video entity
          await base44.asServiceRole.entities.Video.update(video.id, {
            duration_seconds: duration
          });
          
          results.push({
            video_id: video.id,
            title: video.title,
            slug: video.slug,
            r2_key: r2Key,
            duration_extracted: duration,
            duration_formatted: `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`,
            admin_url: `/admin/videos/${video.id}`
          });
        } else {
          errors.push({
            video_id: video.id,
            title: video.title,
            slug: video.slug,
            r2_key: r2Key,
            error: 'Could not parse duration from video file - may be corrupted or unsupported format',
            admin_url: `/admin/videos/${video.id}`
          });
        }
      } catch (error) {
        errors.push({
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          source_url: video.source_video_url,
          error: error.message,
          admin_url: `/admin/videos/${video.id}`
        });
      }
    }

    return Response.json({
      summary: {
        total_videos_checked: allVideos.length,
        videos_needing_duration: videosNeedingDuration.length,
        successfully_updated: results.length,
        failed: errors.length
      },
      updated: results,
      requires_manual_fix: errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Extract duration from MP4/MOV file buffer
 * Reads the mvhd atom from the moov atom
 */
function extractMp4Duration(buffer: ArrayBuffer): number | null {
  try {
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);
    
    let offset = 0;
    while (offset < buffer.byteLength - 8) {
      const atomSize = view.getUint32(offset);
      const atomType = String.fromCharCode(
        uint8[offset + 4],
        uint8[offset + 5],
        uint8[offset + 6],
        uint8[offset + 7]
      );

      if (atomSize <= 0 || atomSize > buffer.byteLength) break;

      // Look for 'moov' atom
      if (atomType === 'moov') {
        const moovStart = offset + 8;
        const moovEnd = offset + atomSize;
        
        let moovOffset = moovStart;
        while (moovOffset < moovEnd - 8) {
          const subAtomSize = view.getUint32(moovOffset);
          const subAtomType = String.fromCharCode(
            uint8[moovOffset + 4],
            uint8[moovOffset + 5],
            uint8[moovOffset + 6],
            uint8[moovOffset + 7]
          );

          if (subAtomSize <= 0) break;

          // Look for 'mvhd' atom
          if (subAtomType === 'mvhd') {
            const version = uint8[moovOffset + 8];
            
            // Timescale and duration positions depend on version
            // Version 0: timescale at offset +20, duration at +24 (4 bytes each)
            // Version 1: timescale at offset +28, duration at +32 (4 + 8 bytes)
            if (version === 0) {
              const timescale = view.getUint32(moovOffset + 20);
              const duration = view.getUint32(moovOffset + 24);
              if (timescale > 0 && duration > 0) {
                return Math.round(duration / timescale);
              }
            } else if (version === 1) {
              const timescale = view.getUint32(moovOffset + 28);
              const duration = Number(view.getBigUint64(moovOffset + 32));
              if (timescale > 0 && duration > 0) {
                return Math.round(duration / timescale);
              }
            }
          }

          moovOffset += subAtomSize;
        }
      }

      offset += atomSize;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing MP4 duration:', error);
    return null;
  }
}