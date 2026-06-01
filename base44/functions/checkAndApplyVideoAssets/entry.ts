import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Checks known CDN paths for generated assets and applies them to the video entity.
 * Use this when the processor completes but the webhook callback never arrives.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id } = await req.json();
    if (!video_id) {
      return Response.json({ error: 'Missing required field: video_id' }, { status: 400 });
    }

    // Get source asset to derive path patterns
    const assets = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'source' });
    const sourceAsset = assets[0];

    if (!sourceAsset || !sourceAsset.r2_key) {
      return Response.json({ error: 'No source asset found for this video' }, { status: 404 });
    }

    const cdnBase = (Deno.env.get('R2_PUBLIC_BUCKET_URL') || '').replace(/\/$/, '');
    const keyParts = sourceAsset.r2_key.split('/');
    // e.g. fleshlab / {brandId} / videos / {uuid} / source.mov
    const studio = keyParts[1] || 'default';
    const uuidDir = keyParts.length >= 4 ? keyParts[keyParts.length - 2] : null;
    const fileBase = keyParts[keyParts.length - 1].replace(/\.[^.]+$/, '');
    const basename = (uuidDir && uuidDir !== 'videos') ? uuidDir : fileBase;

    // Candidate path patterns (try each, use the first that responds 200)
    const thumbCandidates = [
      `${cdnBase}/studios/${studio}/thumbnails/${basename}.jpg`,
      `${cdnBase}/fleshlab/${studio}/thumbnails/${basename}.jpg`,
      `${cdnBase}/studios/${studio}/thumbnails/${fileBase}.jpg`,
      `${cdnBase}/fleshlab/${studio}/thumbnails/${fileBase}.jpg`,
    ];
    const previewCandidates = [
      `${cdnBase}/studios/${studio}/previews/${basename}-preview.mp4`,
      `${cdnBase}/fleshlab/${studio}/previews/${basename}-preview.mp4`,
      `${cdnBase}/studios/${studio}/previews/${fileBase}-preview.mp4`,
      `${cdnBase}/fleshlab/${studio}/previews/${fileBase}-preview.mp4`,
    ];

    const checkUrl = async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok ? url : null;
      } catch {
        return null;
      }
    };

    // Try all candidates in parallel
    const [thumbResults, previewResults] = await Promise.all([
      Promise.all(thumbCandidates.map(checkUrl)),
      Promise.all(previewCandidates.map(checkUrl)),
    ]);

    const foundThumb = thumbResults.find(Boolean);
    const foundPreview = previewResults.find(Boolean);

    if (!foundThumb && !foundPreview) {
      return Response.json({
        status: 'not_found',
        checked_thumbnails: thumbCandidates,
        checked_previews: previewCandidates,
        message: 'No assets found at any expected CDN path. Processor may still be working.',
      });
    }

    // Apply found assets to video entity
    const updateData = {};
    if (foundThumb) updateData.primary_thumbnail_url = foundThumb;
    if (foundPreview) updateData.trailer_url = foundPreview;

    await base44.entities.Video.update(video_id, updateData);

    // Upsert VideoAsset records
    if (foundThumb) {
      const existing = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'thumbnail' });
      if (existing.length > 0) {
        await base44.entities.VideoAsset.update(existing[0].id, { cdn_url: foundThumb, status: 'ready' });
      } else {
        await base44.entities.VideoAsset.create({ video_id, asset_type: 'thumbnail', cdn_url: foundThumb, status: 'ready' });
      }
    }

    if (foundPreview) {
      const existing = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'preview' });
      if (existing.length > 0) {
        await base44.entities.VideoAsset.update(existing[0].id, { cdn_url: foundPreview, status: 'ready' });
      } else {
        await base44.entities.VideoAsset.create({ video_id, asset_type: 'preview', cdn_url: foundPreview, status: 'ready' });
      }
    }

    return Response.json({
      status: 'applied',
      thumbnail_url: foundThumb || null,
      preview_url: foundPreview || null,
      message: 'Assets found and applied to video.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});