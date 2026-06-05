/**
 * performerIdVerificationService
 *
 * Handles performer-side ID document uploads and admin review.
 * All uploaded documents go to private R2 — never public.
 *
 * Performer actions (require Base44 auth, performer must have user_id linked):
 *   get_id_documents    — list own ID documents (safe fields only)
 *   create_upload_url   — generate signed R2 PUT URL for ID upload
 *   confirm_upload      — mark document as uploaded after successful PUT
 *   save_legal_profile  — save legal name, DOB, address (with 18+ guard)
 *
 * Admin actions (require admin role):
 *   admin_get_id_documents     — list all ID docs for a performer
 *   admin_get_signed_url       — get signed GET URL to view/download doc
 *   admin_approve_document     — approve a document
 *   admin_reject_document      — reject with reason
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, PutObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';
import { v4 as uuidv4 } from 'npm:uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const ALLOWED_DOC_TYPES = ['id_front', 'id_back', 'selfie_with_id'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
    },
  });
}

function isOver18(dobString) {
  if (!dobString) return false;
  const dob = new Date(dobString);
  const now = new Date();
  const age = now.getFullYear() - dob.getFullYear() -
    (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  return age >= 18;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ─── PERFORMER ACTIONS ─────────────────────────────────────────────────────
    if (['get_id_documents', 'create_upload_url', 'confirm_upload', 'save_legal_profile'].includes(action)) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      // Find linked performer
      const performers = await base44.asServiceRole.entities.Performer.filter({ user_id: user.id });
      if (!performers || performers.length === 0) {
        return Response.json({ error: 'No performer profile linked to your account' }, { status: 404 });
      }
      const performer = performers[0];

      // ── get_id_documents ──────────────────────────────────────────────────
      if (action === 'get_id_documents') {
        const docs = await base44.asServiceRole.entities.ComplianceDocument.filter({
          performer_id: performer.id
        });
        // Only return ID verification documents, safe fields only (no storage keys)
        const idDocs = docs
          .filter(d => ALLOWED_DOC_TYPES.includes(d.document_type))
          .map(d => ({
            id: d.id,
            document_type: d.document_type,
            filename: d.filename,
            mime_type: d.mime_type,
            file_size_bytes: d.file_size_bytes,
            status: d.status,
            uploaded_at: d.issued_at,
            reviewed_at: d.reviewed_at,
            rejection_reason: d.status === 'rejected' ? d.rejection_reason : null,
            performer_visible_note: d.performer_visible_note,
          }));

        return Response.json({ success: true, documents: idDocs });
      }

      // ── create_upload_url ──────────────────────────────────────────────────
      if (action === 'create_upload_url') {
        const { document_type, file_name, file_size_bytes, mime_type } = body;

        if (!ALLOWED_DOC_TYPES.includes(document_type)) {
          return Response.json({ error: 'Invalid document_type. Must be id_front, id_back, or selfie_with_id' }, { status: 400 });
        }
        if (!ALLOWED_MIME_TYPES.includes(mime_type)) {
          return Response.json({ error: 'Unsupported file type. Please upload JPG, PNG, or PDF.' }, { status: 400 });
        }
        if (!file_size_bytes || file_size_bytes > MAX_FILE_SIZE) {
          return Response.json({ error: 'File is too large. Maximum allowed size is 20MB.' }, { status: 400 });
        }

        const ext = file_name?.split('.').pop()?.toLowerCase() || 'jpg';
        const uniqueId = uuidv4();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        // Private path — never in public bucket
        const r2Key = `private/performers/${performer.id}/id-verification/${document_type}/${timestamp}-${uniqueId}.${ext}`;

        const r2 = getR2Client();
        const putCmd = new PutObjectCommand({
          Bucket: Deno.env.get('R2_BUCKET_NAME'),
          Key: r2Key,
          ContentType: mime_type,
          ContentLength: file_size_bytes,
        });
        const uploadUrl = await getSignedUrl(r2, putCmd, { expiresIn: 3600 });

        // Create a placeholder ComplianceDocument record (status: requested)
        const doc = await base44.asServiceRole.entities.ComplianceDocument.create({
          performer_id: performer.id,
          document_type,
          title: `${document_type.replace(/_/g, ' ').toUpperCase()} — ${performer.display_name}`,
          status: 'requested',
          file_uri: r2Key,
          filename: file_name || `${document_type}.${ext}`,
          mime_type,
          file_size_bytes,
        });

        return Response.json({ success: true, upload_url: uploadUrl, document_id: doc.id });
      }

      // ── confirm_upload ──────────────────────────────────────────────────────
      if (action === 'confirm_upload') {
        const { document_id } = body;
        if (!document_id) return Response.json({ error: 'document_id required' }, { status: 400 });

        const doc = await base44.asServiceRole.entities.ComplianceDocument.get(document_id);
        if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 });
        if (doc.performer_id !== performer.id) return Response.json({ error: 'Access denied' }, { status: 403 });

        await base44.asServiceRole.entities.ComplianceDocument.update(document_id, {
          status: 'uploaded',
          issued_at: new Date().toISOString(),
        });

        return Response.json({ success: true });
      }

      // ── save_legal_profile ──────────────────────────────────────────────────
      if (action === 'save_legal_profile') {
        const {
          legal_first_name, legal_last_name, date_of_birth,
          address_line_1, address_line_2, city, region,
          postal_code, country, nationality, stage_name
        } = body;

        // 18+ guard
        if (date_of_birth && !isOver18(date_of_birth)) {
          return Response.json({
            error: 'You must be at least 18 years old to work with FLESHLAB.'
          }, { status: 400 });
        }

        // Get or create private profile
        const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({
          performer_id: performer.id
        });
        let profile;
        if (profiles && profiles.length > 0) {
          profile = profiles[0];
        } else {
          profile = await base44.asServiceRole.entities.PerformerProfilePrivate.create({ performer_id: performer.id });
        }

        const updateData = { updated_at: new Date().toISOString() };
        if (legal_first_name !== undefined) updateData.legal_first_name = legal_first_name;
        if (legal_last_name !== undefined) updateData.legal_last_name = legal_last_name;
        if (address_line_1 !== undefined) updateData.address_line_1 = address_line_1;
        if (address_line_2 !== undefined) updateData.address_line_2 = address_line_2;
        if (city !== undefined) updateData.city = city;
        if (region !== undefined) updateData.region = region;
        if (postal_code !== undefined) updateData.postal_code = postal_code;
        if (country !== undefined) updateData.country = country;

        await base44.asServiceRole.entities.PerformerProfilePrivate.update(profile.id, updateData);

        // Update performer-level fields
        const performerUpdate = {};
        if (nationality !== undefined) performerUpdate.nationality = nationality;
        if (date_of_birth !== undefined) performerUpdate.date_of_birth = date_of_birth;
        if (stage_name !== undefined && stage_name.trim()) performerUpdate.display_name = stage_name.trim();
        if (Object.keys(performerUpdate).length > 0) {
          await base44.asServiceRole.entities.Performer.update(performer.id, performerUpdate);
        }

        return Response.json({ success: true, message: 'Legal profile saved successfully.' });
      }
    }

    // ─── ADMIN ACTIONS ──────────────────────────────────────────────────────────
    if (action?.startsWith('admin_')) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      const { performer_id } = body;

      // ── admin_get_id_documents ──────────────────────────────────────────────
      if (action === 'admin_get_id_documents') {
        if (!performer_id) return Response.json({ error: 'performer_id required' }, { status: 400 });
        const docs = await base44.asServiceRole.entities.ComplianceDocument.filter({ performer_id });
        const idDocs = docs.filter(d => ALLOWED_DOC_TYPES.includes(d.document_type));
        return Response.json({ success: true, documents: idDocs });
      }

      // ── admin_get_signed_url ────────────────────────────────────────────────
      if (action === 'admin_get_signed_url') {
        const { document_id } = body;
        if (!document_id) return Response.json({ error: 'document_id required' }, { status: 400 });

        const doc = await base44.asServiceRole.entities.ComplianceDocument.get(document_id);
        if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 });
        if (!doc.file_uri) return Response.json({ error: 'No file stored for this document' }, { status: 404 });

        const r2 = getR2Client();
        const getCmd = new GetObjectCommand({
          Bucket: Deno.env.get('R2_BUCKET_NAME'),
          Key: doc.file_uri,
        });
        const signedUrl = await getSignedUrl(r2, getCmd, { expiresIn: 1800 });

        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'ComplianceDocument',
          entity_id: document_id,
          actor_id: user.id,
          actor_role: 'admin',
          action: 'admin_viewed_id_document',
          changes_json: JSON.stringify({ document_type: doc.document_type, performer_id: doc.performer_id }),
          notes: `Admin ${user.email || user.id} viewed ID document: ${doc.document_type}`,
        });

        return Response.json({ success: true, signed_url: signedUrl, expires_in: 1800, filename: doc.filename });
      }

      // ── admin_approve_document ──────────────────────────────────────────────
      if (action === 'admin_approve_document') {
        const { document_id } = body;
        if (!document_id) return Response.json({ error: 'document_id required' }, { status: 400 });

        const doc = await base44.asServiceRole.entities.ComplianceDocument.get(document_id);
        if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 });

        await base44.asServiceRole.entities.ComplianceDocument.update(document_id, {
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: null,
          performer_visible_note: 'This document has been approved.',
        });

        // Check if all 3 ID docs are now approved → update kyc_status to pending (awaiting full review)
        const allDocs = await base44.asServiceRole.entities.ComplianceDocument.filter({
          performer_id: doc.performer_id
        });
        const idDocs = allDocs.filter(d => ALLOWED_DOC_TYPES.includes(d.document_type));
        const updatedDoc = { ...doc, status: 'approved' };
        const allApproved = ALLOWED_DOC_TYPES.every(type =>
          idDocs.some(d => d.document_type === type && (d.id === document_id ? true : d.status === 'approved'))
        );
        if (allApproved) {
          await base44.asServiceRole.entities.Performer.update(doc.performer_id, {
            kyc_status: 'approved',
          });
        }

        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'ComplianceDocument',
          entity_id: document_id,
          actor_id: user.id,
          actor_role: 'admin',
          action: 'admin_approved_id_document',
          changes_json: JSON.stringify({ document_type: doc.document_type, performer_id: doc.performer_id }),
          notes: `Admin ${user.email || user.id} approved ${doc.document_type}`,
        });

        return Response.json({ success: true });
      }

      // ── admin_reject_document ───────────────────────────────────────────────
      if (action === 'admin_reject_document') {
        const { document_id, reason } = body;
        if (!document_id) return Response.json({ error: 'document_id required' }, { status: 400 });

        const doc = await base44.asServiceRole.entities.ComplianceDocument.get(document_id);
        if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 });

        await base44.asServiceRole.entities.ComplianceDocument.update(document_id, {
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: reason || 'Document rejected by admin.',
          performer_visible_note: reason || 'This document was rejected. Please upload a new copy.',
        });

        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'ComplianceDocument',
          entity_id: document_id,
          actor_id: user.id,
          actor_role: 'admin',
          action: 'admin_rejected_id_document',
          changes_json: JSON.stringify({ document_type: doc.document_type, reason }),
          notes: `Admin ${user.email || user.id} rejected ${doc.document_type}: ${reason}`,
        });

        return Response.json({ success: true });
      }
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});