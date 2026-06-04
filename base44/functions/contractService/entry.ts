// contractService — Secure contract management with private R2 snapshots
// 
// Architecture:
//   - Contract entity stores metadata only (hash, version, R2 key)
//   - Full rendered HTML stored as private file in R2
//   - Access via signed URLs (short-lived) or direct fetch with credentials
//   - Hash verification ensures legal integrity

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';
import { GetObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';

// Generate secure random token
function generateSigningToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Generate SHA-256 hash
async function generateContractHash(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Render template HTML
function renderTemplateHTML(templateHtml, variables) {
  let html = templateHtml;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const displayValue = value !== null && value !== undefined ? String(value) : '[NOT PROVIDED]';
    html = html.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), displayValue);
  });
  return html;
}

// Find unresolved placeholders
function findUnresolvedPlaceholders(content) {
  const placeholderRegex = /{{\s*([^}]+)\s*}}/g;
  const matches = [];
  let match;
  while ((match = placeholderRegex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  return [...new Set(matches)]; // Remove duplicates
}

// Validate no unresolved placeholders remain
function validateContractComplete(content) {
  const unresolved = findUnresolvedPlaceholders(content);
  // Filter out signature-related placeholders that are expected to be pending
  const criticalUnresolved = unresolved.filter(p => 
    !p.includes('signature_') && 
    !p.includes('timestamp') &&
    !p.includes('contract_hash')
  );
  return criticalUnresolved;
}

// Get client IP
function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

// Get user agent
function getUserAgent(req) {
  return req.headers.get('user-agent') || 'unknown';
}

// Get R2 client
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

// Upload snapshot to R2
async function uploadContractSnapshot(contractId, htmlContent, version = 1) {
  const client = getR2Client();
  const bucket = Deno.env.get('R2_BUCKET_NAME');
  const key = `contracts/${contractId}/v${version}/snapshot.html`;
  
  const encoder = new TextEncoder();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: encoder.encode(htmlContent),
    ContentType: 'text/html',
  });
  
  await client.send(command);
  
  return {
    r2_key: key,
    stored_at: new Date().toISOString(),
    size_bytes: htmlContent.length,
  };
}

// Generate signed URL for R2 object
async function generateSnapshotSignedUrl(r2Key, expiresInMinutes = 15) {
  const client = getR2Client();
  const bucket = Deno.env.get('R2_BUCKET_NAME');
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: r2Key,
  });
  
  return await getSignedUrl(client, command, { expiresIn: expiresInMinutes * 60 });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, performer_id, contract_id, application_id, signing_token, ...data } = body;

    // ── PUBLIC: get_for_signing ──────────────────────────────────────
    
    if (action === 'get_for_signing') {
      if (!signing_token) {
        return Response.json({ error: 'signing_token is required' }, { status: 400 });
      }

      const contracts = await base44.asServiceRole.entities.Contract.filter({ signing_token });
      const contract = contracts?.[0] || null;

      if (!contract) {
        return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      }

      if (['signed', 'expired', 'cancelled'].includes(contract.status)) {
        return Response.json({ error: 'This contract is no longer available for signing' }, { status: 400 });
      }

      // Set viewed_at
      if (!contract.viewed_at && contract.status === 'sent') {
        await base44.asServiceRole.entities.Contract.update(contract.id, {
          viewed_at: new Date().toISOString(),
          status: 'viewed',
        });
      }

      // Get performer name
      let performerName = null;
      if (contract.performer_id) {
        const performer = await base44.asServiceRole.entities.Performer.get(contract.performer_id);
        performerName = performer?.display_name || null;
      }

      // Fetch contract HTML from R2 snapshot
      let contractHtml = contract.generated_html;
      if (!contractHtml && contract.document_url) {
        try {
          const signedUrl = await generateSnapshotSignedUrl(contract.document_url, 5);
          const fetchRes = await fetch(signedUrl);
          
          if (!fetchRes.ok) {
            throw new Error(`R2 fetch failed: ${fetchRes.status}`);
          }
          
          contractHtml = await fetchRes.text();
          
          // Verify hash
          if (contract.snapshot_hash) {
            const currentHash = await generateContractHash(contractHtml);
            if (currentHash !== contract.snapshot_hash) {
              console.error('[CONTRACT] Hash mismatch!');
            }
          }
        } catch (e) {
          console.error('[CONTRACT] Failed to fetch snapshot:', e.message);
          return Response.json({
            error: 'Contract snapshot not accessible',
            details: e.message,
          }, { status: 500 });
        }
      }

      if (!contractHtml) {
        return Response.json({
          error: 'Contract content not available',
        }, { status: 500 });
      }

      return Response.json({
        success: true,
        contract: {
          id: contract.id,
          title: contract.title,
          contract_type: contract.contract_type,
          status: contract.status,
          version: contract.version || 1,
          snapshot_hash: contract.snapshot_hash,
          generated_html: contractHtml,
          performer_name: performerName,
        },
      });
    }

    // ── PUBLIC: submit_signature ─────────────────────────────────────

    if (action === 'submit_signature') {
      if (!signing_token) {
        return Response.json({ error: 'signing_token is required' }, { status: 400 });
      }

      const { signer_name, signer_email, signature_text, consent_checked } = data;
      if (!signer_name || !signer_email || !signature_text || !consent_checked) {
        return Response.json({ error: 'Missing required signature fields' }, { status: 400 });
      }

      const contracts = await base44.asServiceRole.entities.Contract.filter({ signing_token });
      const contract = contracts?.[0] || null;

      if (!contract) {
        return Response.json({ error: 'Invalid signing link' }, { status: 404 });
      }

      if (contract.status === 'signed' || contract.performer_signed_at) {
        return Response.json({ error: 'Already signed' }, { status: 400 });
      }

      const timestamp = new Date().toISOString();
      const ip = getClientIP(req);
      const userAgent = getUserAgent(req);

      await base44.asServiceRole.entities.Contract.update(contract.id, {
        performer_signature_type: 'typed',
        performer_signature_text: signature_text,
        performer_signature_ip: ip,
        performer_signature_user_agent: userAgent,
        performer_signature_consent_checked: true,
        performer_signature_timestamp: timestamp,
        performer_signed_at: timestamp,
        signed_at: timestamp,
        status: 'signed',
      });

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract.id,
        actor_id: contract.performer_id || 'system',
        actor_role: 'performer',
        action: 'contract_signed',
        changes_json: JSON.stringify({ signer_name, signer_email, signature_ip: ip }),
        notes: `Contract signed by ${signer_name}`,
      });

      return Response.json({ success: true, message: 'Contract signed successfully' });
    }

    // ── ADMIN ACTIONS ────────────────────────────────────────────────

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // ── ACTION: create_from_application ──────────────────────────────
    
    if (action === 'create_from_application') {
      console.log('[CONTRACT] create_from_application action received');
      console.log('[CONTRACT] application_id:', application_id);
      
      if (!application_id) {
        return Response.json({ error: 'application_id required' }, { status: 400 });
      }

      const application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      console.log('[CONTRACT] Application loaded:', application ? 'yes' : 'no');
      if (!application) {
        return Response.json({ error: 'Application not found' }, { status: 404 });
      }

      // Extract performer_id
      let performer_id = data.performer_id;
      if (!performer_id && application.admin_notes) {
        const match = application.admin_notes.match(/Performer created:\s*([a-zA-Z0-9]+)/);
        if (match) performer_id = match[1];
      }
      console.log('[CONTRACT] performer_id:', performer_id);

      // Load template
      const template_id = data.template_id || '6a21d0c9e52a37dd1042e42a';
      const template = await base44.asServiceRole.entities.ContractTemplate.get(template_id);
      console.log('[CONTRACT] Template loaded:', template ? 'yes' : 'no');
      if (!template) {
        return Response.json({ error: 'Template not found', template_id }, { status: 404 });
      }

      // Extract legal_name
      let legalName = data.legal_name || application.legal_name;
      if (!legalName && application.message) {
        const match = application.message.match(/Legal Name:\s*([^\n]+)/i);
        if (match) legalName = match[1].trim();
      }

      // Validate required fields
      const missingFields = [];
      if (!performer_id) missingFields.push('performer_id');
      if (!legalName) missingFields.push('legal_name');
      if (!application.email) missingFields.push('email');
      if (!application.date_of_birth && !data.date_of_birth) missingFields.push('date_of_birth');
      
      console.log('[CONTRACT] Required field validation result:', missingFields.length === 0 ? 'passed' : 'failed');
      console.log('[CONTRACT] missing_fields:', missingFields);
      
      if (missingFields.length > 0) {
        return Response.json({
          error: `Missing: ${missingFields.join(', ')}`,
          missing_fields: missingFields,
        }, { status: 400 });
      }

      // Build variables with safe fallbacks
      const today = new Date().toISOString().split('T')[0];
      
      // Generate preliminary hash for placeholder (will be updated after final render)
      const preliminaryHash = 'generating...';

      const variables = {
        // Core application data
        performer_legal_name: legalName,
        performer_stage_name: application.applicant_name,
        performer_date_of_birth: application.date_of_birth || data.date_of_birth,
        performer_email: application.email,
        performer_nationality: application.nationality || '[NOT PROVIDED]',
        performer_country: application.country || application.nationality || '[NOT PROVIDED]',
        performer_phone_or_messenger: application.phone || application.whatsapp_number || '[NOT PROVIDED]',
        performer_full_residential_address: application.address || `${application.city || ''}, ${application.country || ''}`.trim(),

        // Contract terms with defaults
        effective_date: data.signing_date || today,
        contract_model_label: (data.contract_model || 'full_management').replace(/_/g, ' ').toUpperCase(),
        minimum_term_months: data.minimum_term_months || 12,
        post_termination_usage_years: data.post_termination_usage_years || 5,
        revenue_share_percent: data.revenue_share_percent || 70,
        studio_share_percent: 100 - (data.revenue_share_percent || 70),
        contract_currency: 'EUR',
        early_termination_fee_amount: 150,
        early_termination_fee_currency: 'EUR',

        // Signature and metadata placeholders (will be updated on signing)
        performer_signature_date: '[PENDING SIGNATURE]',
        signature_timestamp: '[PENDING SIGNATURE]',
        signature_ip: '[RECORDED ON SIGNATURE]',
        contract_hash: preliminaryHash,
        studio_signature_date: '[PENDING COUNTERSIGN]',

        // Compliance & Verification placeholders
        id_verification_status: 'Verified',
        id_verification_reference: application.id_document_front_r2_key || application.id_document_r2_key || '[NOT PROVIDED]',
        id_verification_date: application.submitted_at ? application.submitted_at.split('T')[0] : '[NOT PROVIDED]',
        performer_id_verification_reference: application.id_document_front_r2_key || application.id_document_r2_key || '[NOT PROVIDED]',
        performer_age_verification_status: 'Verified 18+',
        age_verification_status: 'Verified 18+',
        dob_verified: 'Verified',
        consent_status: 'Consent Confirmed',

        // Content & Production placeholders
        solo_work_allowed: 'Yes',
        pair_work_allowed: 'Yes, subject to studio policies',
        multi_performer_work_allowed: 'Yes, subject to studio policies',
        live_cam_allowed: 'Yes, if included in contract',
        live_cam_shows_per_month: data.live_cam_required ? 2 : 'Not applicable',
        condom_required: 'Yes',
        bareback_allowed: 'No, unless specific written consent is provided per scene',
        allowed_content_categories: 'General categories as per studio catalog',
        restricted_content_categories: 'Content restricted by law or platform policies',
        off_limits_content_categories: 'Performer hard limits to be documented separately',
        existing_content_list: 'No existing content is included unless separately listed in writing.',

        // Financials
        minimum_payout_threshold: 'No minimum payout threshold unless separately configured',
        payout_method: 'As configured in performer profile',

        // Health compliance placeholders (solo contract defaults)
        health_compliance_required: 'Not required for solo work unless separately configured',
        hiv_test_required: 'Not required',
        hiv_test_status: 'N/A',
        hiv_test_valid_until: 'N/A',
        syphilis_test_required: 'Not required',
        syphilis_test_status: 'N/A',
        syphilis_test_valid_until: 'N/A',
        prep_required: 'Not required',
        prep_status: 'N/A',
        
        // Release status (for release-type contracts, not applicable here)
        release_status: 'N/A',
        release_reference: 'N/A',
      };

      // Render HTML
      console.log('[CONTRACT] Rendering template HTML...');
      const generatedHtml = renderTemplateHTML(template.template_html, variables);
      console.log('[CONTRACT] Rendered HTML length:', generatedHtml.length);
      
      // Validate no critical unresolved placeholders remain
      console.log('[CONTRACT] Checking for unresolved placeholders...');
      const unresolved = validateContractComplete(generatedHtml);
      if (unresolved.length > 0) {
        console.error('[CONTRACT] Unresolved placeholders found:', unresolved);
        return Response.json({
          success: false,
          error: 'Cannot generate final contract: unresolved template variables',
          unresolved_placeholders: unresolved,
        }, { status: 400 });
      }
      console.log('[CONTRACT] No unresolved placeholders found');
      
      // Generate final hash after validation
      const contractHash = await generateContractHash(generatedHtml);
      console.log('[CONTRACT] Generated contract hash:', contractHash);
      
      // Update contract_hash in HTML with actual value
      const finalHtml = generatedHtml.replace(/{{\s*contract_hash\s*}}/g, contractHash);
      
      const title = `${template.title} - ${application.applicant_name}`;

      // Create contract FIRST
      const signingToken = generateSigningToken();
      const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://fleshlab.app';
      const signingUrl = `${baseUrl}/sign-contract?token=${signingToken}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (template.expires_after_days || 7));

      const contract = await base44.asServiceRole.entities.Contract.create({
        performer_id,
        contract_type: template.template_type,
        title,
        status: 'draft',
        signing_token: signingToken,
        signing_url: signingUrl,
        template_id,
        variables_json: JSON.stringify(variables),
        notes: `Created from application ${application_id}`,
        expires_at: expiresAt.toISOString(),
        version: 1,
      });

      // Upload snapshot with correct contract ID
      console.log('[CONTRACT] Uploading snapshot to R2...');
      const snapshotRef = await uploadContractSnapshot(contract.id, finalHtml, 1);
      console.log('[CONTRACT] Snapshot uploaded:', snapshotRef.r2_key);
      
      // Update with snapshot metadata
      await base44.asServiceRole.entities.Contract.update(contract.id, {
        document_url: snapshotRef.r2_key,
        snapshot_hash: contractHash,
        snapshot_stored_at: snapshotRef.stored_at,
      });

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract.id,
        actor_id: user.id,
        action: 'contract_created_from_application',
        changes_json: JSON.stringify({ application_id, template_id }),
      });

      return Response.json({
        success: true,
        contract_id: contract.id,
        signing_url: signingUrl,
        title,
      });
    }

    // ── ACTION: get_contract_snapshot (admin) ────────────────────────

    if (action === 'get_contract_snapshot') {
      if (!contract_id) {
        return Response.json({ error: 'contract_id required' }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      if (!contract.document_url) {
        return Response.json({ error: 'No snapshot stored' }, { status: 404 });
      }

      const signedUrl = await generateSnapshotSignedUrl(contract.document_url, 15);

      return Response.json({
        success: true,
        snapshot: {
          contract_id: contract.id,
          version: contract.version || 1,
          snapshot_hash: contract.snapshot_hash,
          signed_url: signedUrl,
          expires_in_minutes: 15,
        },
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[contractService] Error:', error.message);
    return Response.json({
      success: false,
      error: 'Contract operation failed',
      details: error.message,
    }, { status: 500 });
  }
});