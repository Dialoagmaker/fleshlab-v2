import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'npm:uuid';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { title, slug, brand_id, categories, tags, access_tier, file_name, file_size_bytes, mime_type, duration_seconds } = body;

    // Validate required fields
    if (!title || !file_name || !file_size_bytes || !mime_type) {
      return Response.json({ error: 'Missing required fields: title, file_name, file_size_bytes, mime_type' }, { status: 400 });
    }

    // Validate file size (max 10GB for now)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
    if (file_size_bytes > MAX_FILE_SIZE) {
      return Response.json({ error: 'File size exceeds maximum allowed (10GB)' }, { status: 400 });
    }

    // Validate MIME type
    const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
    if (!allowedMimeTypes.includes(mime_type)) {
      return Response.json({ error: 'Invalid MIME type. Allowed: MP4, MOV, WebM, MKV' }, { status: 400 });
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

    // Generate secure R2 key
    const extension = file_name.split('.').pop() || 'mp4';
    const uniqueId = uuidv4();
    const brandPrefix = brand_id || 'unassigned';
    const r2Key = `fleshlab/${brandPrefix}/videos/${uniqueId}/source.${extension}`;

    // Generate slug if not provided
    const videoSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Create Video Draft
    const videoData = {
      title,
      slug: videoSlug,
      brand_id: brand_id || null,
      categories: categories || [],
      tags: tags || [],
      access_tier: access_tier || 'free',
      status: 'draft',
      processing_status: 'uploading', // PHASE D: Track upload state
      source_video_url: null, // Will be set after processing
      primary_thumbnail_url: null,
      cover_image_url: null,
      trailer_url: null,
      preview_gif_url: null,
    };

    const video = await base44.entities.Video.create(videoData);

    // Create source VideoAsset
    const publicBucketUrl = Deno.env.get('R2_PUBLIC_BUCKET_URL');
    const futureCdnUrl = `${publicBucketUrl}/${r2Key}`;

    // If duration was detected client-side, also store on Video entity directly
    if (duration_seconds) {
      await base44.entities.Video.update(video.id, { duration_seconds: parseInt(duration_seconds) });
    }

    const assetData = {
      video_id: video.id,
      asset_type: 'source',
      r2_key: r2Key,
      cdn_url: futureCdnUrl,
      status: 'pending',
      file_size_bytes: file_size_bytes,
      mime_type: mime_type,
      width: null,
      height: null,
      duration_seconds: duration_seconds ? parseInt(duration_seconds) : null,
    };

    const asset = await base44.entities.VideoAsset.create(assetData);

    // Generate signed PUT URL (60 minutes expiry)
    const putCommand = new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: r2Key,
      ContentType: mime_type,
      ContentLength: file_size_bytes,
    });

    const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 3600 }); // 60 minutes

    return Response.json({
      video_id: video.id,
      asset_id: asset.id,
      r2_key: r2Key,
      upload_url: uploadUrl,
      cdn_url: futureCdnUrl,
      expires_in: 3600,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});