// performerInviteService — Secure welcome email only
// SECURITY: Does NOT create passwords or user accounts
// Only sends informational emails to performers with existing access

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, performer_id, application_id } = body;

    // Admin auth check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // ── ACTION: check_access_status ────────────────────────────────────
    if (action === 'check_access_status') {
      if (!performer_id) {
        return Response.json({ error: 'performer_id required' }, { status: 400 });
      }

      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ error: 'Performer not found' }, { status: 404 });
      }

      const contracts = await base44.asServiceRole.entities.Contract.filter({ performer_id });
      const latestContract = contracts?.sort((a, b) => 
        new Date(b.created_date || 0) - new Date(a.created_date || 0)
      )[0];

      const contractSigned = latestContract?.status === 'signed';
      const performerActive = performer.status === 'active' || performer.account_status === 'active';
      const userLinked = !!performer.user_id;
      const hasLoginCredentials = !!performer.performer_username;

      // Determine access method
      let accessMethod = 'None';
      let accessStatus = 'blocked';
      let accessMessage = 'Dashboard access unavailable.';

      if (!performerActive) {
        accessStatus = 'blocked';
        accessMessage = 'Your performer account is not active. Please contact management.';
      } else if (!contractSigned) {
        accessStatus = 'blocked_until_contract_signed';
        accessMessage = 'Dashboard access is not available until your performer agreement is signed.';
      } else if (userLinked) {
        accessStatus = 'ready';
        accessMethod = 'Linked User Account';
        accessMessage = 'Dashboard access ready via linked user account.';
      } else if (hasLoginCredentials) {
        accessStatus = 'ready';
        accessMethod = 'Performer Login Credentials';
        accessMessage = 'Dashboard access ready via performer login credentials.';
      } else {
        accessStatus = 'blocked_until_user_linked';
        accessMessage = 'Your performer account is active, but no login user is linked yet. Please contact FLESHLAB support.';
      }

      return Response.json({
        success: true,
        access_status: accessStatus,
        access_message: accessMessage,
        access_method: accessMethod,
        contract_signed: contractSigned,
        performer_active: performerActive,
        user_linked: userLinked,
        has_login_credentials: hasLoginCredentials
      });
    }

    // ── ACTION: send_welcome_email ────────────────────────────────────
    // SECURITY: Only sends if user linked or has credentials
    // Does NOT include passwords in email
    if (action === 'send_welcome_email') {
      if (!performer_id) {
        return Response.json({ error: 'performer_id required' }, { status: 400 });
      }

      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ error: 'Performer not found' }, { status: 404 });
      }

      let application = null;
      if (application_id) {
        application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      }

      const recipientEmail = application?.email;
      if (!recipientEmail) {
        return Response.json({ error: 'No email address available' }, { status: 400 });
      }

      // SECURITY CHECK: Only send if user linked or has credentials
      const userLinked = !!performer.user_id || !!application?.linked_user_id;
      const hasLoginCredentials = !!performer.performer_username;

      if (!userLinked && !hasLoginCredentials) {
        return Response.json({
          error: 'Cannot send welcome email: No user linked and no login credentials.',
          security_note: 'Please link user or create login credentials first.'
        }, { status: 400 });
      }

      const contracts = await base44.asServiceRole.entities.Contract.filter({ performer_id });
      const latestContract = contracts?.sort((a, b) => 
        new Date(b.created_date || 0) - new Date(a.created_date || 0)
      )[0];
      const contractSigned = latestContract?.status === 'signed';

      const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://fleshlab.app';
      const loginUrl = `${baseUrl}/performer/login`;

      // Determine login instructions based on access method
      let loginInstructions = '';
      if (userLinked) {
        loginInstructions = `<p style="background: #d4edda; padding: 10px; border-radius: 5px;"><strong>✓ Login Method:</strong> You can log in using your Base44 user account email: <strong>${recipientEmail}</strong></p>`;
      } else if (hasLoginCredentials) {
        loginInstructions = `<p style="background: #fff3cd; padding: 10px; border-radius: 5px;"><strong>⚠ Login Credentials:</strong> Your performer username has been set up. If you haven't received your login credentials, please contact support.</p>`;
      }

      const emailSubject = `Welcome to FLESHLAB Studios — Your Performer Dashboard Access`;
      
      const emailBody = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #c4183c;">Welcome to FLESHLAB Studios!</h1>
              
              <p>Dear <strong>${performer.display_name}</strong>,</p>
              
              <p>Welcome to FLESHLAB! Your performer account has been set up and you now have access to your personal performer dashboard.</p>
              
              ${contractSigned ? 
                '<p style="background: #d4edda; padding: 10px; border-radius: 5px;"><strong>✓ Contract Status:</strong> Your management agreement has been signed and is active.</p>' : 
                '<p style="background: #fff3cd; padding: 10px; border-radius: 5px;"><strong>⚠ Contract Status:</strong> Your contract is pending signature. Please complete the signing process.</p>'
              }
              
              ${loginInstructions}
              
              <h2>Dashboard Access</h2>
              <p>Your performer dashboard includes:</p>
              <ul>
                <li><strong>Earnings Overview:</strong> Track your revenue and payout schedule</li>
                <li><strong>Content Uploads:</strong> Submit photos, videos, and other content</li>
                <li><strong>Compliance Status:</strong> View your verification and document status</li>
                <li><strong>Contract Details:</strong> Access your signed agreement</li>
                <li><strong>Support:</strong> Contact our team for assistance</li>
              </ul>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="${loginUrl}" 
                   style="background: #c4183c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Access Your Dashboard
                </a>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">Login URL: <a href="${loginUrl}" style="color: #c4183c;">${loginUrl}</a></p>
              </div>
              
              <h2>Next Steps</h2>
              <ol>
                <li>Log in to your dashboard using the link above</li>
                <li>Complete your profile information</li>
                <li>Upload any required compliance documents</li>
                <li>Review your contract details</li>
                <li>Start uploading content!</li>
              </ol>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <h3>Need Help?</h3>
                <p>Our support team is here to help you get started. Contact us at:</p>
                <p>
                  📧 Email: <a href="mailto:support@fleshlab.studio" style="color: #c4183c;">support@fleshlab.studio</a><br/>
                  💬 WhatsApp: +49 176 12345678
                </p>
              </div>
              
              <p style="margin-top: 30px;">
                Best regards,<br/>
                <strong>The FLESHLAB Studios Team</strong>
              </p>
              
              <p style="font-size: 12px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                This email contains confidential information intended only for the recipient.
              </p>
            </div>
          </body>
        </html>
      `;

      // Send email
      try {
        await base44.integrations.Core.SendEmail({
          to: recipientEmail,
          subject: emailSubject,
          html: emailBody
        });

        // Audit log
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'Performer',
          entity_id: performer_id,
          actor_id: user.id,
          action: 'welcome_email_sent',
          changes_json: JSON.stringify({ 
            recipient: recipientEmail,
            contract_signed: contractSigned,
            user_linked: userLinked,
            has_login_credentials: hasLoginCredentials
          }),
          notes: `Welcome email sent to ${recipientEmail}`
        });

        return Response.json({
          success: true,
          message: 'Welcome email sent successfully',
          recipient: recipientEmail,
          contract_signed: contractSigned,
          user_linked: userLinked,
          has_login_credentials: hasLoginCredentials
        });

      } catch (emailError) {
        console.error('Email send error:', emailError);
        return Response.json({
          error: 'Failed to send email',
          details: emailError.message
        }, { status: 500 });
      }
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[performerInviteService] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});