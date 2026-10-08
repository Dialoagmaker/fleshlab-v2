import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Validate thumbnail image file integrity
 * Downloads image and verifies:
 * - HTTP 200
 * - content-type image/jpeg
 * - content-length > 0
 * - Magic header FF D8 (JPEG)
 * - Can be decoded as image with valid dimensions
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { video_id } = await req.json();
        
        if (!video_id) {
            return Response.json({ error: 'video_id required' }, { status: 400 });
        }

        // Fetch video
        const video = await base44.entities.Video.get(video_id);
        
        if (!video || !video.primary_thumbnail_url) {
            return Response.json({ 
                error: 'Video or thumbnail URL not found',
                video_id,
                has_thumbnail: !!video?.primary_thumbnail_url
            }, { status: 404 });
        }

        const thumbnailUrl = video.primary_thumbnail_url.trim();
        
        console.log('🔍 Validating thumbnail:', thumbnailUrl);

        // Step 1: HEAD request to check HTTP status and headers
        const headResponse = await fetch(thumbnailUrl, { method: 'HEAD' });
        const httpStatus = headResponse.status;
        const contentType = headResponse.headers.get('content-type');
        const contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

        console.log('📊 HEAD Response:', {
            status: httpStatus,
            contentType,
            contentLength,
        });

        if (httpStatus !== 200) {
            return Response.json({
                video_id,
                thumbnail_url: thumbnailUrl,
                validation_status: 'failed',
                error: `HTTP ${httpStatus}`,
                http_status: httpStatus,
                can_render: false,
                recommendation: 'URL unreachable - regenerate required',
            });
        }

        if (!contentType || !contentType.includes('image/')) {
            return Response.json({
                video_id,
                thumbnail_url: thumbnailUrl,
                validation_status: 'failed',
                error: `Invalid content-type: ${contentType}`,
                content_type: contentType,
                http_status: httpStatus,
                can_render: false,
                recommendation: 'Not an image - regenerate required',
            });
        }

        if (contentLength === 0) {
            return Response.json({
                video_id,
                thumbnail_url: thumbnailUrl,
                validation_status: 'failed',
                error: 'Empty file (0 bytes)',
                content_length: 0,
                http_status: httpStatus,
                can_render: false,
                recommendation: 'Empty file - regenerate required',
            });
        }

        // Step 2: GET request to download actual bytes
        const getResponse = await fetch(thumbnailUrl, { method: 'GET' });
        const arrayBuffer = await getResponse.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        console.log('📥 Downloaded bytes:', uint8Array.length);

        // Step 3: Check JPEG magic header (FF D8)
        const magicHeader = Array.from(uint8Array.slice(0, 2))
            .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
            .join(' ');

        console.log('🔎 Magic header:', magicHeader);

        const isJpeg = magicHeader === 'FF D8';
        
        if (!isJpeg) {
            // Check if it's actually an error page (HTML/XML)
            const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100));
            const isHtml = firstBytes.toLowerCase().includes('<!doctype') || 
                          firstBytes.toLowerCase().includes('<html') ||
                          firstBytes.toLowerCase().includes('<body');
            const isXml = firstBytes.includes('<?xml');
            const isPlainText = firstBytes.toLowerCase().includes('error') ||
                               firstBytes.toLowerCase().includes('not found') ||
                               firstBytes.toLowerCase().includes('access denied');

            return Response.json({
                video_id,
                thumbnail_url: thumbnailUrl,
                validation_status: 'failed',
                error: 'Corrupt file - not a valid JPEG',
                magic_header: magicHeader,
                expected_magic: 'FF D8',
                content_type: contentType,
                http_status: httpStatus,
                content_length: uint8Array.length,
                actual_format: isHtml ? 'HTML error page' : isXml ? 'XML' : isPlainText ? 'Plain text error' : 'Unknown',
                can_render: false,
                recommendation: 'File is corrupt or error page - delete URL and regenerate',
                sample_content: firstBytes.substring(0, 200),
            });
        }

        // Step 4: Try to decode as image to get dimensions
        try {
            const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
            const imageBitmap = await createImageBitmap(blob);
            
            const width = imageBitmap.width;
            const height = imageBitmap.height;

            console.log('✅ Image decoded successfully:', { width, height });

            imageBitmap.close();

            // Validate dimensions
            if (width < 10 || height < 10) {
                return Response.json({
                    video_id,
                    thumbnail_url: thumbnailUrl,
                    validation_status: 'failed',
                    error: `Image too small: ${width}x${height}`,
                    magic_header: magicHeader,
                    width,
                    height,
                    http_status: httpStatus,
                    content_length: uint8Array.length,
                    can_render: false,
                    recommendation: 'Image dimensions invalid - regenerate required',
                });
            }

            // All checks passed
            return Response.json({
                video_id,
                thumbnail_url: thumbnailUrl,
                validation_status: 'success',
                message: 'Thumbnail is valid and should render',
                magic_header: magicHeader,
                content_type: contentType,
                http_status: httpStatus,
                content_length: uint8Array.length,
                width,
                height,
                can_render: true,
                recommendation: 'File is valid - if not rendering, check frontend render logic',
            });

        } catch (decodeError) {
            return Response.json({
                video_id,
                thumbnail_url: thumbnailUrl,
                validation_status: 'failed',
                error: `Failed to decode image: ${decodeError.message}`,
                magic_header: magicHeader,
                content_type: contentType,
                http_status: httpStatus,
                content_length: uint8Array.length,
                can_render: false,
                recommendation: 'JPEG header valid but decode failed - file may be truncated - regenerate required',
                decode_error: decodeError.message,
            });
        }

    } catch (error) {
        console.error('❌ Validation failed:', error);
        return Response.json({ 
            error: error.message,
            validation_status: 'error',
        }, { status: 500 });
    }
});