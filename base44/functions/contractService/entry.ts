// contractService — Service layer for contract management with audit logging and online signing
// 
// Actions:
//   create_contract — Create new contract with document upload
//   create_from_application — Create contract from GuestProductionApplication data
//   update_contract_status — Change contract status
//   update_contract_expiry — Set contract expiration
//   send_for_signature — Send contract for performer signature
//   get_for_signing — Public: Get contract data by signing token
//   submit_signature — Public: Submit performer signature
//   admin_countersign — Admin adds countersignature
//   get_signature_audit — Get signature audit data

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Generate secure random token
function generateSigningToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Render default contract HTML from application data
function renderContractHTML(appData, contractType = 'guest') {
  const {
    legal_name = '[LEGAL NAME]',
    applicant_name = '[STAGE NAME]',
    date_of_birth = '[DOB]',
    nationality = '[NATIONALITY]',
    city = '[CITY]',
    email = '[EMAIL]',
    phone = '[PHONE]',
    whatsapp_number = '[WHATSAPP]',
  } = appData;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
<div style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="text-align: center; color: #c41e3a; margin-bottom: 10px;">FLESHLAB Performer Agreement & Content Release</h1>
  <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 40px;">Effective Date: ${today}</p>

  <div style="border-bottom: 2px solid #c41e3a; margin-bottom: 30px;"></div>

  <h2 style="color: #c41e3a; margin-top: 30px;">1. Parties</h2>
  <p>This Agreement is entered into between:</p>
  <p><strong>Performer:</strong> ${legal_name} (legal name), also known as ${applicant_name} (stage name)<br>
  Date of Birth: ${date_of_birth}<br>
  Nationality: ${nationality}<br>
  Residence: ${city || '[CITY]'}<br>
  Email: ${email}<br>
  Phone/WhatsApp: ${phone || whatsapp_number || '[PHONE]'}</p>
  
  <p><strong>Producer:</strong> FLESHLAB, operated by Dialogmakers International Ltd.</p>

  <h2 style="color: #c41e3a; margin-top: 30px;">2. Age Confirmation</h2>
  <p>Performer confirms they are at least 18 years of age and hereby agrees to participate in the creation of adult-oriented content.</p>

  <h2 style="color: #c41e3a; margin-top: 30px;">3. Content Release</h2>
  <p>Performer grants FLESHLAB exclusive rights to use, distribute, and exploit all content created during production, including but not limited to:</p>
  <ul>
    <li>Video recordings and photographs</li>
    <li>Digital and physical distribution</li>
    <li>Promotional materials and marketing</li>
    <li>Online platforms and third-party distribution</li>
  </ul>

  <h2 style="color: #c41e3a; margin-top: 30px;">4. Revenue Share</h2>
  <p>Performer shall receive ${70}% of net revenue generated from content, payable according to FLESHLAB's payout schedule and terms.</p>

  <h2 style="color: #c41e3a; margin-top: 30px;">5. External Platform Distribution</h2>
  <p>Performer consents to distribution on external platforms including but not limited to xHamster, Pornhub, and other adult content platforms at FLESHLAB's discretion.</p>

  <h2 style="color: #c41e3a; margin-top: 30px;">6. Health & Safety</h2>
  <p>Performer agrees to comply with all health and safety protocols, including STI testing requirements as mandated by FLESHLAB.</p>

  <h2 style="color: #c41e3a; margin-top: 30px;">7. Electronic Signature</h2>
  <p>Performer acknowledges that their electronic signature on this document is legally binding and has the same force and effect as a handwritten signature.</p>

  <h2 style="color: #c41e3a; margin-top: 30px;">8. Governing Law</h2>
  <p>This Agreement shall be governed by and construed in accordance with applicable laws.</p>

  <div style="border-top: 2px solid #c41e3a; margin-top: 40px; padding-top: 30px;">
    <p><strong>By signing below, I confirm that:</strong></p>
    <ul>
      <li>I have read and understood this Agreement</li>
      <li>I am at least 18 years of age</li>
      <li>I voluntarily agree to all terms and conditions</li>
      <li>My electronic signature is legally binding</li>
    </ul>
  </div>
</div>
  `.trim();
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

      return Response.json({
        success: true,
        contract: {
          id: contract.id,
          title: contract.title,
          contract_type: contract.contract_type,
          status: contract.status,
          generated_html: contract.generated_html,
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

      // Generate contract number/title
      const contractNumber = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const title = `FLESHLAB Performer Agreement - ${application.applicant_name}`;

      // Render contract HTML
      const generatedHtml = renderContractHTML({
        legal_name: application.legal_name || application.applicant_name,
        applicant_name: application.applicant_name,
        date_of_birth: application.date_of_birth || '[DOB]',
        nationality: application.nationality || '[NATIONALITY]',
        city: application.city || '[CITY]',
        email: application.email,
        phone: application.phone,
        whatsapp_number: application.whatsapp_number,
      }, data.contract_type || 'guest');

      // Generate signing token and URL
      const signingToken = generateSigningToken();
      const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://fleshlab.app';
      const signingUrl = `${baseUrl}/sign-contract?token=${signingToken}`;

      // Create contract record
      const contract = await base44.asServiceRole.entities.Contract.create({
        performer_id: data.performer_id || null, // May not have performer yet
        contract_type: data.contract_type || 'guest',
        title,
        status: 'draft',
        signing_token: signingToken,
        signing_url: signingUrl,
        generated_html: generatedHtml,
        variables_json: JSON.stringify({
          application_id,
          legal_name: application.legal_name,
          applicant_name: application.applicant_name,
          date_of_birth: application.date_of_birth,
          nationality: application.nationality,
          city: application.city,
          email: application.email,
          phone: application.phone,
          whatsapp_number: application.whatsapp_number,
          revenue_share: data.revenue_share_percentage || 70,
        }),
        notes: data.notes || `Created from application ${application_id}`,
        expires_at: data.expires_at || null,
      });

      // Create audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_created_from_application',
        changes_json: JSON.stringify({
          application_id,
          contract_type: data.contract_type || 'guest',
          title,
        }),
        notes: `Contract created from application ${application_id} for ${application.applicant_name}`,
      });

      return Response.json({
        success: true,
        contract_id: contract.id,
        signing_url: signingUrl,
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

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});