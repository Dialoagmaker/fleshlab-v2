// createDocumentUploadUrl — Generate signed R2 upload URL for compliance documents
// Used for Contract and ComplianceRecord document uploads
// 
// Input:
//   - entity_type: "Contract" | "ComplianceRecord"
//   - performer_id: string
//   - file_name: string
//   - file_size_bytes: number
//   - mime_type: string
//   - document_type: string (optional, for ComplianceRecord)
//
// Returns:
//   - upload_url: signed PUT URL for R2
//   - r2_key: storage path
//   - cdn_url: future public URL (if public bucket)
//   - expires_in: seconds until upload URL expires

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
    const { 
      entity_type, 
      performer_id, 
      file_name, 
      file_size_bytes, 
      mime_type,
      document_type 
    } = body;

    // Validate required fields
    if (!entity_type || !performer_id || !file_name || !file_size_bytes || !mime_type) {
      return Response.json({ 
        error: 'Missing required fields: entity_type, performer_id, file_name, file_size_bytes, mime_type' 
      }, { status: 400 });
    }

    // Validate entity type
    if (!['Contract', 'ComplianceRecord'].includes(entity_type)) {
      return Response.json({ 
        error: 'Invalid entity_type. Must be "Contract" or "ComplianceRecord"' 
      }, { status: 400 });
    }

    // Validate file size (max 50MB for documents)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file_size_bytes > MAX_FILE_SIZE) {
      return Response.json({ error: 'File size exceeds maximum allowed (50MB)' }, { status: 400 });
    }

    // Validate MIME type (documents only)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedMimeTypes.includes(mime_type)) {
      return Response.json({ 
        error: 'Invalid MIME type. Allowed: PDF, JPG, PNG, GIF, DOC, DOCX' 
      }, { status: 400 });
    }

    // Verify performer exists
    const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
    if (!performer) {
      return Response.json({ error: 'Performer not found' }, { status: 404 });
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

    // Generate secure R2 key for documents
    const extension = file_name.split('.').pop() || 'pdf';
    const uniqueId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Storage path: fleshlab/performers/{performerId}/compliance/{type}/{timestamp}-{id}.{ext}
    const docType = document_type || 'document';
    const r2Key = `fleshlab/performers/${performer_id}/compliance/${docType}/${timestamp}-${uniqueId}.${extension}`;

    // Generate CDN URL
    const publicBucketUrl = Deno.env.get('R2_PUBLIC_BUCKET_URL');
    const cdnUrl = `${publicBucketUrl}/${r2Key}`;

    // Generate signed PUT URL (60 minutes expiry)
    const putCommand = new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: r2Key,
      ContentType: mime_type,
      ContentLength: file_size_bytes,
    });

    const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 3600 });

    return Response.json({
      entity_type,
      performer_id,
      r2_key: r2Key,
      upload_url: uploadUrl,
      cdn_url: cdnUrl,
      expires_in: 3600,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});