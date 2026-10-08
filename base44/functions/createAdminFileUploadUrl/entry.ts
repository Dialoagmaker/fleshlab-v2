// createAdminFileUploadUrl — Centralized admin file upload service
// Generates signed R2 upload URLs for all admin document uploads
// 
// Supported context types:
//   - compliance_record: Medical/ID records for performers
//   - contract: Contract documents for performers
//   - compliance_document: General compliance documents
//   - performer_profile_image: Performer profile/cover images
//   - studio_document: General studio documents
//   - generic_admin_document: Catch-all for other admin documents
//
// Input:
//   - context_type: string (required)
//   - performer_id: string (optional, required for performer-related contexts)
//   - contract_id: string (optional, for contract-related uploads)
//   - record_id: string (optional, for existing record updates)
//   - file_name: string (required)
//   - mime_type: string (required)
//   - file_size: number (required)
//
// Returns:
//   - upload_url: signed PUT URL (60 min expiry)
//   - object_key: R2 storage path
//   - file_name: original filename
//   - mime_type: file MIME type
//   - file_size: file size in bytes
//   - storage_provider: "r2"

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

    const body = await req.json().catch(() => ({}));
    const { 
      context_type,
      performer_id,
      contract_id,
      record_id,
      file_name,
      mime_type,
      file_size
    } = body;

    // Validate required fields
    if (!context_type || !file_name || !mime_type || !file_size) {
      return Response.json({ 
        error: 'Missing required fields: context_type, file_name, mime_type, file_size' 
      }, { status: 400 });
    }

    // Validate context type
    const validContexts = [
      'compliance_record',
      'contract',
      'compliance_document',
      'performer_profile_image',
      'studio_document',
      'generic_admin_document'
    ];
    if (!validContexts.includes(context_type)) {
      return Response.json({ 
        error: `Invalid context_type. Must be one of: ${validContexts.join(', ')}` 
      }, { status: 400 });
    }

    // Validate performer_id for performer-related contexts
    const performerContexts = ['compliance_record', 'contract', 'compliance_document', 'performer_profile_image'];
    if (performerContexts.includes(context_type) && !performer_id) {
      return Response.json({ 
        error: `performer_id is required for context_type: ${context_type}` 
      }, { status: 400 });
    }

    // Validate file size (max 50MB for documents)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file_size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File size exceeds maximum allowed (50MB)' }, { status: 400 });
    }

    // Validate MIME types based on context
    const documentMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    const allowedMimeTypes = context_type === 'performer_profile_image' 
      ? imageMimeTypes 
      : documentMimeTypes;
    
    if (!allowedMimeTypes.includes(mime_type)) {
      return Response.json({ 
        error: `Invalid MIME type for ${context_type}. Allowed: ${allowedMimeTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Verify performer exists if required
    if (performer_id) {
      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ error: 'Performer not found' }, { status: 404 });
      }
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

    // Generate R2 key with consistent path structure
    const extension = file_name.split('.').pop() || 'file';
    const uniqueId = uuidv4();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    let r2Key;
    switch (context_type) {
      case 'compliance_record':
        r2Key = `admin/compliance_records/${performer_id}/${year}/${month}/${uniqueId}-${file_name}`;
        break;
      case 'contract':
        r2Key = `admin/contracts/${performer_id}/${year}/${month}/${uniqueId}-${file_name}`;
        break;
      case 'compliance_document':
        r2Key = `admin/compliance_documents/${performer_id}/${year}/${month}/${uniqueId}-${file_name}`;
        break;
      case 'performer_profile_image':
        r2Key = `admin/performer_profile_images/${performer_id}/${year}/${month}/${uniqueId}-${file_name}`;
        break;
      case 'studio_document':
        r2Key = `admin/studio_documents/${year}/${month}/${uniqueId}-${file_name}`;
        break;
      default:
        r2Key = `admin/generic_documents/${year}/${month}/${uniqueId}-${file_name}`;
    }

    // Generate signed PUT URL (60 minutes expiry)
    const putCommand = new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: r2Key,
      ContentType: mime_type,
      ContentLength: file_size,
    });

    const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 3600 });

    return Response.json({
      context_type,
      performer_id,
      object_key: r2Key,
      upload_url: uploadUrl,
      file_name,
      mime_type,
      file_size,
      storage_provider: 'r2',
      expires_in: 3600,
    });

  } catch (error) {
    console.error('createAdminFileUploadUrl error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});