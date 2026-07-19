import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { S3Client, DeleteObjectsCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';

const RETENTION_DAYS = { rejected: 30, withdrawn: 7, inactive: 180, approved: 2555 };
function daysSince(v) { if (!v) return 0; return Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 86400000)); }
function keys(app) { return [...(app.profile_photo_r2_keys || []), app.intro_video_r2_key, app.hardcore_video_r2_key, app.id_document_r2_key, app.id_document_front_r2_key, app.id_document_back_r2_key, app.selfie_with_id_r2_key].filter(Boolean); }
async function audit(base44, app, action, actorId, details) { await base44.asServiceRole.entities.RecruitmentAuditLog.create({ subject_type:'application', subject_id: app.id, action, actor_type:'admin', actor_id: actorId, severity:'warning', details_json: JSON.stringify(details || {}), created_at: new Date().toISOString() }).catch(() => null); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const { action = 'dry_run', application_id } = await req.json();
    const accountId = Deno.env.get('R2_ACCOUNT_ID'); const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID'); const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY'); const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const r2 = new S3Client({ region:'auto', endpoint:`https://${accountId}.r2.cloudflarestorage.com`, credentials:{ accessKeyId, secretAccessKey } });
    const apps = application_id ? [await base44.asServiceRole.entities.GuestProductionApplication.get(application_id)] : await base44.asServiceRole.entities.GuestProductionApplication.filter({ request_type:'performer_application' }, '-created_date', 500);
    const candidates = [];
    for (const app of apps.filter(Boolean)) {
      const age = daysSince(app.rejected_at || app.updated_date || app.created_date);
      const state = app.status === 'rejected' ? 'rejected' : app.status === 'withdrawn' ? 'withdrawn' : app.status === 'inactive' ? 'inactive' : ['approved','performer_created','active','user_linked'].includes(app.status) ? 'approved' : null;
      if (state && age >= RETENTION_DAYS[state]) candidates.push({ app, state, age, r2Keys: keys(app) });
    }
    if (action === 'dry_run') return Response.json({ success:true, dry_run:true, candidates: candidates.map(c => ({ application_id:c.app.id, state:c.state, age_days:c.age, file_count:c.r2Keys.length })) });
    if (action !== 'purge') return Response.json({ error:'Invalid action' }, { status:400 });
    let deletedFiles = 0;
    for (const c of candidates) {
      if (c.r2Keys.length) {
        await r2.send(new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: c.r2Keys.map(Key => ({ Key })), Quiet: true } }));
        deletedFiles += c.r2Keys.length;
      }
      await audit(base44, c.app, 'privacy_lifecycle_files_purged', user.id, { state:c.state, age_days:c.age, file_count:c.r2Keys.length });
      await base44.asServiceRole.entities.GuestProductionApplication.update(c.app.id, { profile_photo_r2_keys: [], intro_video_r2_key: null, hardcore_video_r2_key: null, id_document_r2_key: null, id_document_front_r2_key: null, id_document_back_r2_key: null, selfie_with_id_r2_key: null, media_upload_status: 'none', compliance_upload_status: 'none' });
    }
    return Response.json({ success:true, purged_applications:candidates.length, deleted_files:deletedFiles });
  } catch (error) { return Response.json({ error:error.message }, { status:500 }); }
});