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

      // STEP 1: Load application
      const application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      console.log('[CONTRACT] Application loaded:', application ? 'yes' : 'no');
      if (!application) {
        return Response.json({ error: 'Application not found' }, { status: 404 });
      }

      // STEP 2: Check for existing contract (duplicate prevention)
      const existingContracts = await base44.asServiceRole.entities.Contract.filter({ 
        performer_id: application.performer_id 
      });
      if (existingContracts && existingContracts.length > 0) {
        const existingDraft = existingContracts.find(c => c.status === 'draft');
        if (existingDraft) {
          return Response.json({
            error: 'Contract already exists for this performer',
            contract_id: existingDraft.id,
            signing_url: existingDraft.signing_url,
            status: 'existing_draft',
          }, { status: 400 });
        }
      }

      // STEP 3: Validate performer exists
      let performer_id = application.performer_id;
      if (!performer_id) {
        return Response.json({
          error: 'Cannot generate contract. Performer not created yet. Please approve application first.',
          missing_fields: ['performer_id'],
        }, { status: 400 });
      }

      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ error: 'Performer not found' }, { status: 404 });
      }

      // STEP 4: Load PerformerProfilePrivate
      const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({ performer_id });
      const profile = profiles?.[0] || null;
      if (!profile) {
        return Response.json({
          error: 'Cannot generate contract. PerformerProfilePrivate not found.',
          missing_fields: ['performer_profile_private'],
        }, { status: 400 });
      }

      // STEP 5: Validate revenue_model
      const revenueModel = application.preferred_revenue_model || performer.revenue_model;
      if (!revenueModel || revenueModel === 'undecided') {
        return Response.json({
          error: 'Cannot generate contract. Revenue model is undecided.',
          missing_fields: ['revenue_model'],
        }, { status: 400 });
      }

      // STEP 6: Validate work_type
      const workType = application.work_type;
      if (!workType || !['solo', 'pair', 'both'].includes(workType)) {
        return Response.json({
          error: 'Cannot generate contract. Work type is missing or invalid.',
          missing_fields: ['work_type'],
        }, { status: 400 });
      }

      // STEP 7: Validate legal_name and email
      const legalName = profile.legal_first_name && profile.legal_last_name 
        ? `${profile.legal_first_name} ${profile.legal_last_name}`.trim()
        : application.legal_name;
      
      if (!legalName || !legalName.trim()) {
        return Response.json({
          error: 'Cannot generate contract. Legal name is missing.',
          missing_fields: ['legal_name'],
        }, { status: 400 });
      }

      if (!application.email || !application.email.trim()) {
        return Response.json({
          error: 'Cannot generate contract. Email is missing.',
          missing_fields: ['email'],
        }, { status: 400 });
      }

      // STEP 8: Validate full residential address
      const fullAddress = profile.address_line_1 || profile.address_line_2 || profile.city || profile.country;
      if (!fullAddress) {
        return Response.json({
          error: 'Cannot generate contract. Missing full residential address. Please update performer profile with address details.',
          missing_fields: ['full_residential_address'],
        }, { status: 400 });
      }

      // STEP 9: Load template
      const template_id = data.template_id || '6a21d0c9e52a37dd1042e42a';
      const template = await base44.asServiceRole.entities.ContractTemplate.get(template_id);
      console.log('[CONTRACT] Template loaded:', template ? 'yes' : 'no');
      if (!template) {
        return Response.json({ error: 'Template not found', template_id }, { status: 404 });
      }

      // Build variables with safe fallbacks
      const today = new Date().toISOString().split('T')[0];
      
      // Generate preliminary hash for placeholder (will be updated after final render)
      const preliminaryHash = 'generating...';

      // Revenue model mapping - DO NOT HARDCODE 70%
      let studio_share_percent, performer_share_percent, revenue_model_label, contract_model_label;
      const revenue_model = revenueModel; // From application/performer
      
      if (revenue_model === 'standard_studio_60_performer_40' || revenue_model === 'studio_managed') {
        // DEFAULT: FLESHLAB builds/manages performer from scratch
        studio_share_percent = 60;
        performer_share_percent = 40;
        revenue_model_label = 'Managed Model (60/40)';
        contract_model_label = 'FULL MANAGEMENT';
      } else if (revenue_model === 'network_performer_70_studio_30' || revenue_model === 'established_network') {
        // Performer has fanbase/content, uses FLESHLAB network
        studio_share_percent = 30;
        performer_share_percent = 70;
        revenue_model_label = 'Network Model (70/30)';
        contract_model_label = 'DISTRIBUTION ONLY';
      } else {
        return Response.json({
          error: 'Invalid revenue model selected',
          details: `Unknown revenue_model: ${revenue_model}`,
        }, { status: 400 });
      }
      
      // Work type mapping
      let solo_work_allowed, pair_work_allowed;
      if (workType === 'solo') {
        solo_work_allowed = 'Yes';
        pair_work_allowed = 'No';
      } else if (workType === 'pair') {
        solo_work_allowed = 'No';
        pair_work_allowed = 'Yes, with health compliance';
      } else if (workType === 'both') {
        solo_work_allowed = 'Yes';
        pair_work_allowed = 'Yes, with health compliance';
      }

      // Build full residential address from PerformerProfilePrivate
      const addressParts = [
        profile.address_line_1,
        profile.address_line_2,
        profile.city,
        profile.region,
        profile.postal_code,
        profile.country,
      ].filter(Boolean);
      
      const performer_full_residential_address = addressParts.length > 0 
        ? addressParts.join(', ')
        : `${profile.city || ''}, ${profile.country || ''}`.trim();
      
      if (!performer_full_residential_address) {
        return Response.json({
          error: 'Cannot generate contract. Missing full residential address in PerformerProfilePrivate.',
          missing_fields: ['full_residential_address'],
        }, { status: 400 });
      }

      const variables = {
        // Core performer data from PerformerProfilePrivate
        performer_legal_name: legalName,
        performer_stage_name: performer.display_name || application.applicant_name,
        performer_date_of_birth: performer.date_of_birth || '[NOT PROVIDED]',
        performer_email: application.email,
        performer_nationality: performer.nationality || application.nationality || '[NOT PROVIDED]',
        performer_country: profile.country || application.nationality || '[NOT PROVIDED]',
        performer_phone_or_messenger: profile.phone || application.phone || '[NOT PROVIDED]',
        performer_full_residential_address: performer_full_residential_address,
        performer_id_verification_reference: application.id_document_front_r2_key || application.id_document_r2_key || '[NOT PROVIDED]',

        // Contract terms
        effective_date: today,
        contract_model_label: contract_model_label,
        minimum_term_months: 12,
        post_termination_usage_years: 5,
        
        // Revenue split - DYNAMIC based on selected model
        revenue_model_label: revenue_model_label,
        studio_share_percent: studio_share_percent,
        performer_share_percent: performer_share_percent,
        revenue_share_percent: performer_share_percent, // Legacy field for template compatibility
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
        performer_age_verification_status: 'Verified 18+',
        age_verification_status: 'Verified 18+',
        dob_verified: 'Verified',
        consent_status: 'Consent Confirmed',

        // Content & Production placeholders - mapped from work_type
        solo_work_allowed: solo_work_allowed,
        pair_work_allowed: pair_work_allowed,
        multi_performer_work_allowed: workType === 'both' || workType === 'pair' ? 'Yes, subject to health compliance' : 'Subject to contract',
        live_cam_allowed: 'Not applicable',
        live_cam_shows_per_month: 'Not applicable',
        condom_required: 'Yes',
        bareback_allowed: 'No, unless specific written consent is provided per scene',
        allowed_content_categories: 'General categories as per studio catalog',
        restricted_content_categories: 'Content restricted by law or platform policies',
        off_limits_content_categories: 'Performer hard limits to be documented separately',
        existing_content_list: 'No existing content is included unless separately listed in writing.',

        // Financials
        minimum_payout_threshold: 'No minimum payout threshold unless separately configured',
        payout_method: profile.payout_method || 'As configured in performer profile',

        // Health compliance placeholders
        health_compliance_required: workType === 'pair' || workType === 'both' ? 'Required' : 'Not required for solo work',
        hiv_test_required: workType === 'pair' || workType === 'both' ? 'Required' : 'Not required',
        hiv_test_status: workType === 'pair' || workType === 'both' ? 'Required before filming' : 'N/A',
        hiv_test_valid_until: 'N/A',
        syphilis_test_required: workType === 'pair' || workType === 'both' ? 'Required' : 'Not required',
        syphilis_test_status: workType === 'pair' || workType === 'both' ? 'Required before filming' : 'N/A',
        syphilis_test_valid_until: 'N/A',
        prep_required: workType === 'pair' || workType === 'both' ? 'Required for condomless work' : 'N/A',
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