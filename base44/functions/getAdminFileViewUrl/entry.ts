// getAdminFileViewUrl — Generate signed GET URLs for admin file previews/downloads
// 
// Input (one of):
//   - object_key: string (direct R2 key)
//   - OR record_id + record_type: for entity-based lookups
//     - record_type: "compliance_record" | "contract" | "compliance_document"
//
// Returns:
//   - signed_url: temporary signed GET URL (15 min expiry)
//   - file_name: original filename
//   - mime_type: file MIME type
//   - file_size: file size in bytes

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { object_key, record_id, record_type } = body;

    // Validate input
    if (!object_key && !record_id) {
      return Response.json({ 
        error: 'Either object_key or record_id must be provided' 
      }, { status: 400 });
    }

    // Resolve object_key from entity if record_id provided
    let resolvedObjectKey = object_key;
    let fileName = 'document';
    let mimeType = 'application/octet-stream';
    let fileSize = null;

    if (record_id && record_type) {
      let record;
      switch (record_type) {
        case 'compliance_record':
          record = await base44.asServiceRole.entities.ComplianceRecord.get(record_id);
          if (!record) {
            return Response.json({ error: 'ComplianceRecord not found' }, { status: 404 });
          }
          resolvedObjectKey = record.document_url;
          fileName = record.document_type + '_document';
          break;
        case 'contract':
          record = await base44.asServiceRole.entities.Contract.get(record_id);
          if (!record) {
            return Response.json({ error: 'Contract not found' }, { status: 404 });
          }
          resolvedObjectKey = record.document_url;
          fileName = record.title || 'contract';
          break;
        case 'compliance_document':
          record = await base44.asServiceRole.entities.ComplianceDocument.get(record_id);
          if (!record) {
            return Response.json({ error: 'ComplianceDocument not found' }, { status: 404 });
          }
          resolvedObjectKey = record.file_uri;
          fileName = record.filename || 'document';
          mimeType = record.mime_type || mimeType;
          fileSize = record.file_size_bytes;
          break;
        default:
          return Response.json({ 
            error: 'Invalid record_type. Must be: compliance_record, contract, or compliance_document' 
          }, { status: 400 });
      }

      if (!resolvedObjectKey) {
        return Response.json({ error: 'No file associated with this record' }, { status: 404 });
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

    // Generate signed GET URL (15 minutes expiry for previews)
    const getCommand = new GetObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: resolvedObjectKey,
    });

    const signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 900 });

    return Response.json({
      signed_url: signedUrl,
      file_name: fileName,
      mime_type: mimeType,
      file_size: fileSize,
      expires_in: 900,
    });

  } catch (error) {
    console.error('getAdminFileViewUrl error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});