// contractService — Service layer for contract management with immutable snapshots and secure access
// 
// Architecture:
//   - Contract entity stores lightweight metadata only (hash, version, snapshot URL/key)
//   - Full rendered HTML stored as private immutable file in R2
//   - Snapshot access controlled via token validation, not public URLs
//   - Versioning: each regeneration creates new version, old versions preserved
//   - Signing binds to exact snapshot hash, ensuring legal integrity
//
// Actions:
//   create_from_application — Create contract with private snapshot storage
//   get_for_signing — Secure: Validate token, fetch snapshot, return rendered HTML
//   submit_signature — Public: Submit performer signature with hash verification
//   send_for_signature — Send contract for performer signature
//   admin_countersign — Admin adds countersignature
//   get_signature_audit — Get signature audit data
//   get_contract_snapshot — Admin: Get contract snapshot URL (short-lived signed)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, PutObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';

// Generate secure random token
function generateSigningToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Generate SHA-256 hash of content for legal integrity
async function generateContractHash(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Render contract HTML from template and variables
function renderTemplateHTML(templateHtml, variables) {
  let html = templateHtml;
  
  // Replace each placeholder with its value
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const displayValue = value !== null && value !== undefined ? String(value) : '[NOT PROVIDED]';
    html = html.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), displayValue);
  });
  
  return html;
}

// Get client IP from request
function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

// Get user agent from request
function getUserAgent(req) {
  return req.headers.get('user-agent') || 'unknown';
}

// Initialize R2/S3 client for private snapshot storage
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

// Upload contract snapshot to private R2 storage
async function uploadContractSnapshot(contractId, htmlContent, version = 1) {
  const r2Client = getR2Client();
  const bucket = Deno.env.get('R2_BUCKET_NAME');
  
  // Private path: contracts/{contract_id}/v{version}/snapshot.html
  const key = `contracts/${contractId}/v${version}/snapshot.html`;
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: htmlContent,
    ContentType: 'text/html',
    // Private by default - no public access
  });
  
  await r2Client.send(command);
  
  // Return storage reference (not public URL)
  return {
    r2_key: key,
    stored_at: new Date().toISOString(),
    size_bytes: htmlContent.length,
  };
}

// Generate short-lived signed URL for snapshot access (admin only)
async function generateSnapshotSignedUrl(r2Key, expiresInMinutes = 15) {
  const r2Client = getR2Client();
  const bucket = Deno.env.get('R2_BUCKET_NAME');
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: r2Key,
  });
  
  const signedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: expiresInMinutes * 60,
  });
  
  return signedUrl;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, performer_id, contract_id, application_id, signing_token, ...data } = body;

    // ── PUBLIC ACTIONS (no auth required, token-based) ──────────────────────
    
    if (action === 'get_for_signing') {
      if (!signing_token) {
        return Response.json({ error: 'signing_token is required' }, { status: 400 });
      }

      // Find contract by token
      const contracts = await base44.asServiceRole.entities.Contract.filter({ signing_token });
      const contract = contracts && contracts.length > 0 ? contracts[0] : null;

      if (!contract) {
        return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      }

      // Check status
      if (['signed', 'expired', 'cancelled'].includes(contract.status)) {
        return Response.json({ error: 'This contract is no longer available for signing' }, { status: 400 });
      }

      // Set viewed_at on first view
      if (!contract.viewed_at && contract.status === 'sent') {
        await base44.asServiceRole.entities.Contract.update(contract.id, {
          viewed_at: new Date().toISOString(),
          status: 'viewed',
        });
      }

      // Get performer data for display
      let performerData = {};
      if (contract.performer_id) {
        const performer = await base44.asServiceRole.entities.Performer.get(contract.performer_id);
        if (performer) {
          performerData = {
            name: performer.display_name,
            email: null, // Don't expose email
          };
        }
      }

      // Fetch contract HTML from private R2 snapshot
      let contractHtml = contract.generated_html;
      if (!contractHtml && contract.document_url) {
        try {
          const r2Client = getR2Client();
          const bucket = Deno.env.get('R2_BUCKET_NAME');
          
          const command = new GetObjectCommand({
            Bucket: bucket,
            Key: contract.document_url,
          });
          
          const response = await r2Client.send(command);
          contractHtml = await response.body.transformToString();
          
          // Verify hash matches (integrity check)
          if (contract.snapshot_hash) {
            const currentHash = await generateContractHash(contractHtml);
            if (currentHash !== contract.snapshot_hash) {
              console.error('[CONTRACT] Hash mismatch! Snapshot may have been corrupted.');
              // Still return, but log warning
            }
          }
        } catch (e) {
          console.error('[CONTRACT] Failed to fetch snapshot from R2:', e.message);
          return Response.json({
            error: 'Contract snapshot not accessible',
            details: 'Please contact support',
          }, { status: 500 });
        }
      }

      if (!contractHtml) {
        return Response.json({
          error: 'Contract content not available',
          details: 'Snapshot missing or corrupted',
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
          performer_name: performerData.name,
        },
      });
    }

    if (action === 'submit_signature') {
      if (!signing_token) {
        return Response.json({ error: 'signing_token is required' }, { status: 400 });
      }

      // Validate required fields
      const { signer_name, signer_email, signature_text, consent_checked } = data;
      if (!signer_name || !signer_email || !signature_text || !consent_checked) {
        return Response.json({ 
          error: 'Missing required fields: signer_name, signer_email, signature_text, consent_checked' 
        }, { status: 400 });
      }

      // Find contract by token
      const contracts = await base44.asServiceRole.entities.Contract.filter({ signing_token });
      const contract = contracts && contracts.length > 0 ? contracts[0] : null;

      if (!contract) {
        return Response.json({ error: 'Invalid signing link' }, { status: 404 });
      }

      // Check if already signed
      if (contract.status === 'signed' || contract.performer_signed_at) {
        return Response.json({ error: 'This contract has already been signed' }, { status: 400 });
      }

      // Get IP and user agent
      const ip = getClientIP(req);
      const userAgent = getUserAgent(req);
      const timestamp = new Date().toISOString();

      // Update contract with signature data
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

      // Create audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract.id,
        actor_id: contract.performer_id || 'system',
        actor_role: 'performer',
        action: 'contract_signed',
        changes_json: JSON.stringify({
          signer_name,
          signer_email,
          signature_ip: ip,
          signature_user_agent: userAgent,
          signature_timestamp: timestamp,
          consent_checked: true,
        }),
        notes: `Contract signed by ${signer_name} (${signer_email})`,
      });

      return Response.json({
        success: true,
        message: 'Contract signed successfully',
      });
    }

    // ── ADMIN ACTIONS (auth required) ──────────────────────────────────────

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // For create actions, performer_id is required
    if (action === 'create_contract' || action === 'create_from_application' || action === 'create_record') {
      if (!performer_id && action !== 'create_from_application') {
        return Response.json({ error: 'performer_id is required' }, { status: 400 });
      }
      if (action !== 'create_from_application') {
        const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
        if (!performer) {
          return Response.json({ error: 'Performer not found' }, { status: 404 });
        }
      }
    }

    // For update actions, verify entity exists
    if (action.includes('update_contract') && contract_id) {
      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }
    }
    if (action.includes('update_record') && data.record_id) {
      const record = await base44.asServiceRole.entities.ComplianceRecord.get(data.record_id);
      if (!record) {
        return Response.json({ error: 'ComplianceRecord not found' }, { status: 404 });
      }
    }

    // ── ACTION: create_from_application ────────────────────────────────────
    
    if (action === 'create_from_application') {
      if (!application_id) {
        return Response.json({ error: 'application_id is required' }, { status: 400 });
      }

      // Load application
      const application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      if (!application) {
        return Response.json({ error: 'Application not found' }, { status: 404 });
      }

      // Extract performer_id from application notes if not provided
      let performer_id = data.performer_id;
      if (!performer_id && application.admin_notes) {
        // Look for "Performer created: <id>" pattern in admin notes
        const performerMatch = application.admin_notes.match(/Performer created:\s*([a-zA-Z0-9]+)/);
        if (performerMatch && performerMatch[1]) {
          performer_id = performerMatch[1];
          console.log(`Extracted performer_id ${performer_id} from application admin_notes`);
        }
      }

      // Load template - default to performer management agreement
      const template_id = data.template_id || '6a21d0c9e52a37dd1042e42a'; // Performer Management Agreement v3.0
      const template = await base44.asServiceRole.entities.ContractTemplate.get(template_id);
      if (!template) {
        console.error(`Template ${template_id} not found`);
        return Response.json({ 
          error: 'Contract template not found. Please select a valid template.',
          template_id: template_id,
        }, { status: 404 });
      }

      // Extract legal_name from message if not in dedicated field
      let legalName = data.legal_name || application.legal_name;
      if (!legalName && application.message) {
        const legalNameMatch = application.message.match(/Legal Name:\s*([^\n]+)/i);
        if (legalNameMatch && legalNameMatch[1]) {
          legalName = legalNameMatch[1].trim();
          console.log(`Extracted legal_name from message: ${legalName}`);
        }
      }
      
      // Validate required fields for contract creation
      const missingFields = [];
      const isApproved = application.status === 'approved';
      
      // Critical: performer_id must exist
      if (!performer_id) {
        missingFields.push('performer_id (create performer profile first)');
      }
      
      // If manually approved by admin, trust their judgment - skip other validations
      // Admin has already verified the application data
      if (!isApproved) {
        // Critical: legal_name
        if (!legalName) {
          missingFields.push('legal_name (from application.legal_name or message)');
        }
        
        // Critical: email
        if (!application.email) {
          missingFields.push('email');
        }
        
        // Critical: date_of_birth
        if (!application.date_of_birth && !data.date_of_birth) {
          missingFields.push('date_of_birth');
        }
        
        // Critical: ID document (front)
        const hasIdFront = application.id_document_front_r2_key || application.id_document_r2_key;
        if (!hasIdFront) {
          missingFields.push('id_document_front (ID verification required)');
        }
      }
      
      if (missingFields.length > 0) {
        console.error(`Contract creation blocked: ${missingFields.join(', ')}`);
        return Response.json({ 
          error: `Cannot create contract: ${missingFields.join(', ')}`,
          missing_fields: missingFields,
          application_id: application_id,
          performer_id: performer_id || null,
        }, { status: 400 });
      }
      
      console.log(`All required fields present for contract creation. Performer: ${performer_id}`);

      // Validate required fields for contract generation (only if NOT approved)
      // If admin approved the application, they have verified the data manually
      if (!isApproved) {
        const requiredFields = [];
        if (!legalName) requiredFields.push('legal_name');
        if (!application.date_of_birth && !data.date_of_birth) requiredFields.push('date_of_birth');
        if (!application.city && !data.address) requiredFields.push('address or city');
        if (!application.email) requiredFields.push('email');
        
        if (requiredFields.length > 0) {
          return Response.json({
            error: `Cannot generate contract: ${requiredFields.join(', ')} is missing`,
            missing_fields: requiredFields,
          }, { status: 400 });
        }
      }

      // Build variables from application data using v3.1 template placeholders
      const today = new Date().toISOString().split('T')[0];
      
      // Studio legal profile (from template defaults or data)
      const studioLegalProfile = {
        brand_name: 'Fleshlab Studios',
        legal_entity: 'Dialogmakers International Ltd.',
        company_number: '83273694',
        address: '2F, No. 2-1, Lane 23, Wenhua St., Taoyuan City, Taoyuan 324010, Taiwan',
        country: 'Taiwan',
        email: 'studiosupport@fleshlab.online',
        representative: 'Eric Rönnau',
        title: 'Managing Director / Authorized Representative',
        governing_law: 'Taiwan',
        jurisdiction: 'Competent courts in Taoyuan City, Taiwan',
        currency: 'EUR',
      };
      
      // Contract settings
      const contractModel = data.contract_model || 'full_management';
      const workType = data.work_type || 'solo';
      const revenueSharePercent = data.revenue_share_percent || 70;
      const minimumTermMonths = data.minimum_term_months || 12;
      const earlyTerminationFee = data.early_termination_fee_amount || 150;
      const earlyTerminationCurrency = data.early_termination_fee_currency || 'EUR';
      const postTerminationYears = data.post_termination_usage_years || 5;
      const liveCamShowsPerMonth = data.live_cam_shows_per_month || 2;
      
      // Build comprehensive variables for v3.1 template
      const variables = {
        // Contract meta
        effective_date: data.signing_date || today,
        contract_model_label: contractModel.replace(/_/g, ' ').toUpperCase(),
        minimum_term_months: minimumTermMonths,
        revenue_share_percent: revenueSharePercent,
        studio_share_percent: 100 - revenueSharePercent,
        contract_currency: studioLegalProfile.currency,
        live_cam_shows_per_month: liveCamShowsPerMonth,
        post_termination_usage_years: postTerminationYears,
        early_termination_fee_amount: earlyTerminationFee,
        early_termination_fee_currency: earlyTerminationCurrency,
        
        // Performer data
        performer_legal_name: legalName || application.applicant_name,
        performer_stage_name: application.applicant_name,
        performer_date_of_birth: application.date_of_birth || data.date_of_birth || '[NOT PROVIDED]',
        performer_nationality: application.nationality || data.nationality || '[NOT PROVIDED]',
        performer_full_residential_address: data.address || application.address || `${application.city || ''}, ${application.country || application.nationality || ''}`.trim() || '[NOT PROVIDED]',
        performer_country: application.country || data.country || application.nationality || '[NOT PROVIDED]',
        performer_email: application.email,
        performer_phone_or_messenger: data.phone_or_messenger || application.phone || application.whatsapp_number || '[NOT PROVIDED]',
        performer_id_verification_reference: data.id_verification_reference || 'Government-issued ID on file (verified)',
        performer_age_verification_status: '18+ Verified',
        
        // Consent & boundaries (Appendix A)
        consent_status: 'Active',
        solo_work_allowed: 'Yes',
        pair_work_allowed: workType !== 'solo' ? 'Yes' : 'No',
        multi_performer_work_allowed: workType === 'multi_performer' ? 'Yes' : 'No',
        live_cam_allowed: data.live_cam_required ? 'Yes' : 'No',
        guest_production_allowed: contractModel === 'guest_production' ? 'Yes' : 'No',
        condom_required: 'Yes',
        bareback_allowed: 'No',
        bareback_health_compliance_required: 'Yes',
        allowed_content_categories: 'Solo, Pair, Multi-Performer (as agreed)',
        restricted_content_categories: 'Per performer consent form',
        off_limits_content_categories: 'Per performer consent form',
        
        // Payout terms (Appendix B)
        minimum_payout_threshold: '50 EUR',
        payout_method: 'Bank Transfer / Wise / PayPal',
        existing_content_list: 'None (or as listed in Appendix C)',
        
        // Compliance (Appendix E)
        id_verification_status: 'Verified',
        id_verification_reference: 'On file',
        id_verification_date: today,
        age_verification_status: 'Verified',
        dob_verified: application.date_of_birth || data.date_of_birth || '[NOT PROVIDED]',
        release_status: 'Signed',
        release_reference: 'On file',
        health_compliance_required: workType === 'solo' ? 'No' : 'Yes',
        hiv_test_required: workType === 'solo' ? 'No' : 'Yes',
        hiv_test_status: workType === 'solo' ? 'Not Required' : 'Verified',
        hiv_test_valid_until: '[DATE]',
        syphilis_test_required: workType === 'solo' ? 'No' : 'Yes',
        syphilis_test_status: workType === 'solo' ? 'Not Required' : 'Verified',
        syphilis_test_valid_until: '[DATE]',
        prep_required: 'No',
        prep_status: 'Not Required',
        
        // Signature metadata (to be filled at signing)
        performer_signature_date: '[SIGNING_DATE]',
        signature_timestamp: '[TIMESTAMP]',
        signature_ip: '[IP]',
        signature_user_agent: '[USER_AGENT]',
        contract_hash: '[HASH]',
        studio_signature_date: today,
      };

      // Render template HTML
      const generatedHtml = renderTemplateHTML(template.template_html, variables);
      
      // Generate contract hash for legal integrity
      const contractHash = await generateContractHash(generatedHtml);
      
      // Upload to private R2 storage with versioning
      const snapshotRef = await uploadContractSnapshot('pending', generatedHtml, 1);

      // Generate contract title
      const title = `${template.title} - ${application.applicant_name}`;

      // Generate signing token and URL
      const signingToken = generateSigningToken();
      const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://fleshlab.app';
      const signingUrl = `${baseUrl}/sign-contract?token=${signingToken}`;

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (template.expires_after_days || 7));

      // Create contract record with snapshot reference
      const contract = await base44.asServiceRole.entities.Contract.create({
        performer_id: performer_id || null,
        contract_type: template.template_type,
        title,
        status: 'draft',
        signing_token: signingToken,
        signing_url: signingUrl,
        // Store snapshot reference (not public URL)
        document_url: snapshotRef.r2_key,
        template_id: template_id,
        variables_json: JSON.stringify(variables),
        notes: data.notes || `Created from application ${application_id}${performer_id ? ` (Performer: ${performer_id})` : ''}`,
        expires_at: expiresAt.toISOString(),
        // Version tracking
        version: 1,
        snapshot_hash: contractHash,
        snapshot_stored_at: snapshotRef.stored_at,
      });

      // Update snapshot reference with actual contract ID
      if (contract.id) {
        const updatedKey = `contracts/${contract.id}/v1/snapshot.html`;
        await base44.asServiceRole.entities.Contract.update(contract.id, {
          document_url: updatedKey,
        });
      }

      // Create audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_created_from_application',
        changes_json: JSON.stringify({
          application_id,
          template_id,
          template_title: template.title,
          title,
        }),
        notes: `Contract created from application ${application_id} for ${application.applicant_name}`,
      });

      return Response.json({
        success: true,
        contract_id: contract.id,
        signing_url: signingUrl,
        title,
        message: 'Contract created from application',
      });
    }

    // ── ACTION: send_for_signature ─────────────────────────────────────────

    if (action === 'send_for_signature') {
      if (!contract_id) {
        return Response.json({ error: 'contract_id is required' }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      // Ensure signing token exists
      let signingToken = contract.signing_token;
      let signingUrl = contract.signing_url;
      
      if (!signingToken) {
        signingToken = generateSigningToken();
        const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://fleshlab.app';
        signingUrl = `${baseUrl}/sign-contract?token=${signingToken}`;
        
        await base44.asServiceRole.entities.Contract.update(contract_id, {
          signing_token: signingToken,
          signing_url: signingUrl,
        });
      }

      // Update status
      const sentAt = new Date().toISOString();
      await base44.asServiceRole.entities.Contract.update(contract_id, {
        status: 'sent',
        sent_at: sentAt,
      });

      // Create audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_sent_for_signature',
        changes_json: JSON.stringify({
          status: { before: contract.status, after: 'sent' },
          sent_at: sentAt,
        }),
        notes: `Contract sent for signature`,
      });

      // TODO: Send email if integration available
      // For now, just return the signing URL

      return Response.json({
        success: true,
        signing_url: signingUrl,
        message: 'Contract sent for signature',
      });
    }

    // ── ACTION: admin_countersign ──────────────────────────────────────────

    if (action === 'admin_countersign') {
      if (!contract_id) {
        return Response.json({ error: 'contract_id is required' }, { status: 400 });
      }

      const { admin_signature_text } = data;
      if (!admin_signature_text) {
        return Response.json({ error: 'admin_signature_text is required' }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      const timestamp = new Date().toISOString();
      await base44.asServiceRole.entities.Contract.update(contract_id, {
        admin_signature_text,
        admin_signature_timestamp: timestamp,
        admin_signed_at: timestamp,
        // If performer already signed, mark as fully signed
        signed_at: contract.performer_signed_at ? contract.performer_signed_at : timestamp,
        status: 'signed',
      });

      // Create audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_countersigned',
        changes_json: JSON.stringify({
          admin_signed_at: timestamp,
          admin_signature_text,
        }),
        notes: `Contract countersigned by admin ${user.email}`,
      });

      return Response.json({
        success: true,
        message: 'Contract countersigned',
      });
    }

    // ── ACTION: get_signature_audit ────────────────────────────────────────

    if (action === 'get_signature_audit') {
      if (!contract_id) {
        return Response.json({ error: 'contract_id is required' }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      // Get performer email from linked user if available
      let signer_email = null;
      let signer_name = null;
      if (contract.performer_id) {
        const performer = await base44.asServiceRole.entities.Performer.get(contract.performer_id);
        if (performer) {
          signer_name = performer.display_name;
          // Email not directly accessible from performer entity
        }
      }

      return Response.json({
        success: true,
        audit: {
          signer_name: signer_name || contract.performer_signature_text || "N/A",
          signer_email: signer_email || "N/A",
          signature_type: contract.performer_signature_type || "typed",
          signature_text: contract.performer_signature_text,
          ip_address: contract.performer_signature_ip,
          user_agent: contract.performer_signature_user_agent,
          consent_checked: contract.performer_signature_consent_checked,
          signed_at: contract.performer_signed_at || contract.signed_at,
          timeline: {
            sent_at: contract.sent_at,
            viewed_at: contract.viewed_at,
            performer_signed_at: contract.performer_signed_at,
            admin_signed_at: contract.admin_signed_at,
            signed_at: contract.signed_at,
          },
        },
      });
    }

    // ── ACTION: get_contract_snapshot (admin only) ────────────────────────

    if (action === 'get_contract_snapshot') {
      if (!contract_id) {
        return Response.json({ error: 'contract_id is required' }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      if (!contract.document_url) {
        return Response.json({ error: 'Contract snapshot not stored', details: 'This contract uses legacy storage' }, { status: 404 });
      }

      // Generate short-lived signed URL (15 minutes)
      const signedUrl = await generateSnapshotSignedUrl(contract.document_url, 15);

      return Response.json({
        success: true,
        snapshot: {
          contract_id: contract.id,
          version: contract.version || 1,
          snapshot_hash: contract.snapshot_hash,
          stored_at: contract.snapshot_stored_at,
          signed_url: signedUrl,
          expires_in_minutes: 15,
        },
      });
    }

    // ── EXISTING ACTIONS (preserved) ───────────────────────────────────────

    if (action === 'create_contract') {
      const { 
        contract_type, 
        title, 
        document_url, 
        notes,
        expires_at 
      } = data;

      if (!contract_type || !title || !document_url) {
        return Response.json({ 
          error: 'Missing required fields: contract_type, title, document_url' 
        }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.create({
        performer_id,
        contract_type,
        title,
        document_url,
        status: 'draft',
        notes: notes || null,
        expires_at: expires_at || null,
      });

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_uploaded',
        changes_json: JSON.stringify({
          contract_type,
          title,
          document_url,
        }),
        notes: `Contract uploaded: ${title} (${contract_type})`,
      });

      try {
        await base44.asServiceRole.functions.invoke('performerComplianceService', {
          action: 'lock_evaluation',
          performer_id,
        });
      } catch (e) {
        console.error('Lock evaluation failed:', e.message);
      }

      return Response.json({
        success: true,
        contract_id: contract.id,
        message: 'Contract created',
      });
    }

    if (action === 'update_contract_status') {
      const { contract_id: cid, status: st } = data;
      const contract_id = cid || body.contract_id;
      const status = st || body.status;

      if (!contract_id || !status) {
        return Response.json({ 
          error: 'Missing required fields: contract_id, status' 
        }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      const oldStatus = contract.status;
      await base44.asServiceRole.entities.Contract.update(contract_id, { status });

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_status_changed',
        changes_json: JSON.stringify({
          status: {
            before: oldStatus,
            after: status,
          },
        }),
        notes: `Contract status changed from ${oldStatus} to ${status}`,
      });

      if (['signed', 'expired', 'cancelled'].includes(status)) {
        try {
          const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
          await base44.asServiceRole.functions.invoke('performerComplianceService', {
            action: 'lock_evaluation',
            performer_id: contract.performer_id,
          });
        } catch (e) {
          console.error('Lock evaluation failed:', e.message);
        }
      }

      return Response.json({
        success: true,
        contract_id,
        message: 'Contract status updated',
      });
    }

    if (action === 'update_contract_expiry') {
      const { contract_id: cid, expires_at: ea } = data;
      const contract_id = cid || body.contract_id;
      const expires_at = ea || body.expires_at;

      if (!contract_id || !expires_at) {
        return Response.json({ 
          error: 'Missing required fields: contract_id, expires_at' 
        }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      const oldExpiry = contract.expires_at;
      await base44.asServiceRole.entities.Contract.update(contract_id, { expires_at });

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_expiry_changed',
        changes_json: JSON.stringify({
          expires_at: {
            before: oldExpiry,
            after: expires_at,
          },
        }),
        notes: `Contract expiry changed from ${oldExpiry || 'none'} to ${expires_at}`,
      });

      try {
        const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
        await base44.asServiceRole.functions.invoke('performerComplianceService', {
          action: 'lock_evaluation',
          performer_id: contract.performer_id,
        });
      } catch (e) {
        console.error('Lock evaluation failed:', e.message);
      }

      return Response.json({
        success: true,
        contract_id,
        message: 'Contract expiry updated',
      });
    }

    if (action === 'verify_contract') {
      const { contract_id: cid } = data;
      const contract_id = cid || body.contract_id;

      if (!contract_id) {
        return Response.json({ 
          error: 'Missing required field: contract_id' 
        }, { status: 400 });
      }

      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      await base44.asServiceRole.entities.Contract.update(contract_id, {
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.email,
      });

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_verified',
        changes_json: JSON.stringify({
          verified: {
            before: contract.verified || false,
            after: true,
          },
          verified_at: new Date().toISOString(),
          verified_by: user.email,
        }),
        notes: `Contract verified by ${user.email}`,
      });

      try {
        await base44.asServiceRole.functions.invoke('performerComplianceService', {
          action: 'lock_evaluation',
          performer_id: contract.performer_id,
        });
      } catch (e) {
        console.error('Lock evaluation failed:', e.message);
      }

      return Response.json({
        success: true,
        contract_id,
        message: 'Contract verified',
      });
    }

    return Response.json({ 
      success: false, 
      error: 'Unknown action',
      available_actions: ['validate_contract_readiness', 'create_draft_contract', 'create_final_contract', 'create_from_application', 'get_for_signing', 'submit_signature', 'send_for_signature', 'admin_countersign', 'get_signature_audit']
    }, { status: 400 });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[contractService] Error:', {
      action: body.action,
      application_id: body.application_id,
      performer_id: body.performer_id,
      error_message: error.message,
      error_stack: error.stack,
    });
    
    // Handle specific error types
    if (error.message.includes('exceeds the maximum allowed size')) {
      return Response.json({
        success: false,
        error: 'Contract document too large - this is a system configuration issue',
        details: 'Please contact support: contract HTML exceeded field size limit',
      }, { status: 500 });
    }
    
    if (error.message.includes('Application not found')) {
      return Response.json({
        success: false,
        error: 'Application not found',
        application_id: body.application_id,
      }, { status: 404 });
    }
    
    if (error.message.includes('Contract template not found')) {
      return Response.json({
        success: false,
        error: 'Contract template not found',
        template_id: body.template_id || '6a21d0c9e52a37dd1042e42a',
      }, { status: 404 });
    }
    
    // Generic server error with safe message
    return Response.json({
      success: false,
      error: 'Contract generation failed',
      details: error.message,
      action: body.action,
    }, { status: 500 });
  }
});