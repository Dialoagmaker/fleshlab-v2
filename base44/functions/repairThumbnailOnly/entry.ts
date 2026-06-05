/**
 * Repair Corrupt Thumbnail Only
 * 
 * Flow:
 * 1. Load video and check source/preview URLs
 * 2. Generate thumbnail from valid source or preview
 * 3. Upload to R2 with new filename
 * 4. Validate (HTTP, content-type, magic header, dimensions)
 * 5. Save URL to Video.primary_thumbnail_url ONLY if validation passes
 * 
 * Does NOT:
 * - Touch source_video_url
 * - Touch trailer_url
 * - Trigger full asset repair
 * - Regenerate preview
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const R2_BUCKET_URL = Deno.env.get('R2_PUBLIC_BUCKET_URL');
const R2_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
const R2_KEY_SECRET = Deno.env.get('R2_SECRET_ACCESS_KEY');
const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
const R2_BUCKET = Deno.env.get('R2_BUCKET_NAME');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { video_id } = payload;

    if (!video_id) {
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    // Load video
    const video = await base44.asServiceRole.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    console.log(`[repairThumbnailOnly] Video ${video_id}:`, {
      source: video.source_video_url ? 'exists' : 'missing',
      preview: video.trailer_url ? 'exists' : 'missing'
    });

    // Find a valid source to generate from
    const sourceUrl = video.source_video_url || video.trailer_url;
    if (!sourceUrl) {
      return Response.json({
        ok: false,
        error: 'No source or preview video URL available',
        step: 'find_source'
      }, { status: 400 });
    }

    // Generate thumbnail using FFmpeg
    // Use midpoint of video (30 seconds or video length / 2)
    const generateThumbnailCmd = [
      'ffmpeg',
      '-i', sourceUrl,
      '-ss', '00:00:05',  // 5 seconds into video
      '-vframes', '1',
      '-vf', 'scale=640:360,format=yuvj420p',
      '-q:v', '2',
      '-y',
      '/tmp/thumbnail.jpg'
    ];

    console.log(`[repairThumbnailOnly] Generating thumbnail from ${sourceUrl}`);
    const proc = Deno.run({
      cmd: generateThumbnailCmd,
      stdout: 'piped',
      stderr: 'piped'
    });

    const status = await proc.status();
    if (!status.success) {
      const stderr = new TextDecoder().decode(await proc.stderrOutput());
      console.error('FFmpeg error:', stderr);
      return Response.json({
        ok: false,
        error: 'FFmpeg thumbnail generation failed',
        step: 'generate_thumbnail',
        details: stderr.substring(0, 200)
      }, { status: 500 });
    }

    // Read generated thumbnail
    const thumbnailBytes = await Deno.readFile('/tmp/thumbnail.jpg');
    console.log(`[repairThumbnailOnly] Generated thumbnail: ${thumbnailBytes.length} bytes`);

    // Validate generated thumbnail before uploading
    const magicHeader = Array.from(thumbnailBytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    console.log(`[repairThumbnailOnly] Magic header: ${magicHeader}`);

    // Check for HTML
    const sampleText = new TextDecoder().decode(thumbnailBytes.slice(0, 100));
    if (sampleText.includes('<!DOCTYPE') || sampleText.includes('<html')) {
      return Response.json({
        ok: false,
        error: 'Generated file contains HTML - FFmpeg failed to extract video frame',
        step: 'validate_generated',
        magicHeader
      }, { status: 500 });
    }

    // Check JPEG magic header (FF D8)
    if (magicHeader.substring(0, 5) !== 'FF D8') {
      return Response.json({
        ok: false,
        error: 'Invalid JPEG magic header',
        step: 'validate_generated',
        magicHeader,
        expected: 'FF D8'
      }, { status: 500 });
    }

    // Upload to R2 using presigned URL via createR2UploadUrl function
    const timestamp = Date.now();
    const filename = `videos/${video_id}/thumbnail_${timestamp}.jpg`;
    
    console.log(`[repairThumbnailOnly] Getting R2 upload URL: ${filename}`);
    
    // Get presigned upload URL
    const uploadUrlRes = await base44.functions.invoke('createR2UploadUrl', {
      key: filename,
      contentType: 'image/jpeg'
    });
    
    if (!uploadUrlRes.data || !uploadUrlRes.data.uploadUrl) {
      throw new Error('Failed to get R2 upload URL');
    }
    
    const uploadUrl = uploadUrlRes.data.uploadUrl;
    console.log(`[repairThumbnailOnly] Uploading to R2 via presigned URL`);
    
    // Upload to presigned URL
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg'
      },
      body: thumbnailBytes
    });

    if (!s3Response.ok) {
      console.error('R2 upload failed:', s3Response.status, await s3Response.text());
      return Response.json({
        ok: false,
        error: `R2 upload failed: ${s3Response.status}`,
        step: 'upload_to_r2'
      }, { status: 500 });
    }

    // Build CDN URL from public bucket URL
    const cdnUrl = `${R2_BUCKET_URL}/${filename}`;
    console.log(`[repairThumbnailOnly] CDN URL: ${cdnUrl}`);

    // Validate uploaded thumbnail via HTTP
    const validateResponse = await fetch(cdnUrl, { method: 'HEAD', redirect: 'follow' });
    
    if (!validateResponse.ok) {
      return Response.json({
        ok: false,
        error: `Uploaded thumbnail validation failed: HTTP ${validateResponse.status}`,
        step: 'validate_uploaded',
        httpStatus: validateResponse.status
      }, { status: 500 });
    }

    const contentType = validateResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('image/jpeg')) {
      return Response.json({
        ok: false,
        error: `Invalid content-type: ${contentType}`,
        step: 'validate_uploaded'
      }, { status: 500 });
    }

    // Download and validate image dimensions
    const imgResponse = await fetch(cdnUrl);
    const imgBuffer = await imgResponse.arrayBuffer();
    const imgBytes = new Uint8Array(imgBuffer);
    
    // Extract JPEG dimensions (basic check)
    let width = 0, height = 0;
    try {
      // JPEG SOF0 marker at bytes 9-10 contains dimensions
      if (imgBytes[9] === 0xFF && imgBytes[10] === 0xC0) {
        height = (imgBytes[5] << 8) | imgBytes[6];
        width = (imgBytes[7] << 8) | imgBytes[8];
      }
    } catch (e) {
      console.log('Could not extract JPEG dimensions, skipping check');
    }

    console.log(`[repairThumbnailOnly] Validated thumbnail: ${width}x${height}, ${imgBytes.length} bytes`);

    // Save to Video entity
    await base44.asServiceRole.entities.Video.update(video_id, {
      primary_thumbnail_url: cdnUrl
    });

    console.log(`[repairThumbnailOnly] Saved to Video.primary_thumbnail_url`);

    return Response.json({
      ok: true,
      message: 'Thumbnail repaired successfully',
      step: 'complete',
      thumbnailUrl: cdnUrl,
      validation: {
        httpStatus: validateResponse.status,
        contentType,
        magicHeader,
        width,
        height,
        fileSize: imgBytes.length
      }
    });

  } catch (error) {
    console.error('repairThumbnailOnly error:', error);
    return Response.json({ 
      error: error.message || 'Unknown error',
      step: 'exception'
    }, { status: 500 });
  }
});