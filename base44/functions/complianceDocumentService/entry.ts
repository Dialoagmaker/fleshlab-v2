// complianceDocumentService - Admin service for compliance document management
// Actions:
// - create_document: Generate signed upload URL and create document record
// - list_by_performer: List all documents for a performer
// - update_document_status: Update status (approve/reject/request_reupload)
// - get_download_url: Generate signed download URL for admin
// - archive_document: Soft delete/archive a document

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, PutObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
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
    const { action, performer_id, document_id, ...data } = body;

    switch (action) {
      case 'create_document': {
        const { document_type, title, file_name, file_size_bytes, mime_type, issued_at, expires_at, admin_note, performer_visible_note } = data;

        // Validate required fields
        if (!performer_id || !document_type || !title || !file_name || !file_size_bytes || !mime_type) {
          return Response.json({ 
            error: 'Missing required fields: performer_id, document_type, title, file_name, file_size_bytes, mime_type' 
          }, { status: 400 });
        }

        // Validate file size (max 50MB)
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file_size_bytes > MAX_FILE_SIZE) {
          return Response.json({ error: 'File size exceeds maximum (50MB)' }, { status: 400 });
        }

        // Validate MIME type
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
          return Response.json({ error: 'Invalid MIME type' }, { status: 400 });
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

        // Generate secure R2 key
        const extension = file_name.split('.').pop() || 'pdf';
        const uniqueId = uuidv4();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const r2Key = `fleshlab/performers/${performer_id}/compliance/${document_type}/${timestamp}-${uniqueId}.${extension}`;

        // Generate signed PUT URL (60 minutes expiry)
        const putCommand = new PutObjectCommand({
          Bucket: Deno.env.get('R2_BUCKET_NAME'),
          Key: r2Key,
          ContentType: mime_type,
          ContentLength: file_size_bytes,
        });

        const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 3600 });

        // Create document record (status: uploaded, pending review)
        const document = await base44.entities.ComplianceDocument.create({
          performer_id,
          document_type,
          title,
          status: 'uploaded',
          file_uri: r2Key,
          filename: file_name,
          mime_type,
          file_size: file_size_bytes,
          issued_at: issued_at || null,
          expires_at: expires_at || null,
          admin_note: admin_note || null,
          performer_visible_note: performer_visible_note || null,
        });

        // Log audit
        await base44.entities.AuditLog.create({
          entity_type: 'ComplianceDocument',
          entity_id: document.id,
          actor_id: user.id,
          actor_role: user.role,
          action: 'compliance_document_uploaded',
          changes_json: JSON.stringify({ document_type, filename: file_name }),
        });

        return Response.json({
          document_id: document.id,
          upload_url: uploadUrl,
          r2_key: r2Key,
          expires_in: 3600,
        });
      }

      case 'list_by_performer': {
        if (!performer_id) {
          return Response.json({ error: 'performer_id is required' }, { status: 400 });
        }

        const documents = await base44.entities.ComplianceDocument.filter(
          { performer_id },
          '-created_date'
        );

        return Response.json({ documents });
      }

      case 'update_document_status': {
        const { status, rejection_reason, admin_note } = data;

        if (!document_id || !status) {
          return Response.json({ error: 'document_id and status are required' }, { status: 400 });
        }

        const validStatuses = ['approved', 'rejected', 'under_review', 'requested', 'expired', 'revoked'];
        if (!validStatuses.includes(status)) {
          return Response.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Get current document for audit
        const document = await base44.asServiceRole.entities.ComplianceDocument.get(document_id);
        if (!document) {
          return Response.json({ error: 'Document not found' }, { status: 404 });
        }

        const updateData = {
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejection_reason || null,
          admin_note: admin_note || document.admin_note,
        };

        await base44.entities.ComplianceDocument.update(document_id, updateData);

        // Log audit
        await base44.entities.AuditLog.create({
          entity_type: 'ComplianceDocument',
          entity_id: document_id,
          actor_id: user.id,
          actor_role: user.role,
          action: 'compliance_document_status_updated',
          changes_json: JSON.stringify({ 
            previous_status: document.status,
            new_status: status,
            rejection_reason 
          }),
        });

        return Response.json({ success: true });
      }

      case 'get_download_url': {
        if (!document_id) {
          return Response.json({ error: 'document_id is required' }, { status: 400 });
        }

        const document = await base44.asServiceRole.entities.ComplianceDocument.get(document_id);
        if (!document || !document.file_uri) {
          return Response.json({ error: 'Document not found' }, { status: 404 });
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

        // Generate signed GET URL (15 minutes expiry)
        const getCommand = new GetObjectCommand({
          Bucket: Deno.env.get('R2_BUCKET_NAME'),
          Key: document.file_uri,
        });

        const downloadUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 900 });

        return Response.json({ 
          download_url: downloadUrl,
          filename: document.filename,
          mime_type: document.mime_type
        });
      }

      case 'archive_document': {
        if (!document_id) {
          return Response.json({ error: 'document_id is required' }, { status: 400 });
        }

        // Get document first for audit log
        const document = await base44.asServiceRole.entities.ComplianceDocument.get(document_id);
        if (!document) {
          return Response.json({ error: 'Document not found' }, { status: 404 });
        }

        // Soft delete by archiving (don't actually delete from R2)
        await base44.entities.ComplianceDocument.update(document_id, {
          status: 'revoked',
          admin_note: (document.admin_note || '') + '\n[Archived by admin on ' + new Date().toISOString() + ']',
        });

        // Log audit
        await base44.entities.AuditLog.create({
          entity_type: 'ComplianceDocument',
          entity_id: document_id,
          actor_id: user.id,
          actor_role: user.role,
          action: 'compliance_document_archived',
          changes_json: JSON.stringify({ previous_status: document.status }),
        });

        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});