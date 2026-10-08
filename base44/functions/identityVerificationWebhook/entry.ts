import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // For webhooks, we don't authenticate the user - we verify the provider signature
    // Each provider has different signature verification methods
    
    const { action, provider, payload } = await req.json();
    
    if (!provider) {
      return Response.json({ error: 'Provider is required' }, { status: 400 });
    }
    
    // Provider-specific signature verification (FUTURE - when provider configured)
    // For now, return not_configured
    const isConfigured = await checkProviderConfigured(provider);
    if (!isConfigured) {
      return Response.json({ 
        success: false,
        error: `Provider ${provider} is not configured`,
        code: 'not_configured'
      }, { status: 503 });
    }
    
    switch (action) {
      case 'handle_webhook': {
        // Verify provider signature (provider-specific)
        const signatureValid = await verifyProviderSignature(provider, req, payload);
        if (!signatureValid) {
          return Response.json({ error: 'Invalid signature' }, { status: 401 });
        }
        
        // Extract session ID and result from provider payload
        const { provider_session_id, status, result } = await parseProviderWebhookPayload(provider, payload);
        
        if (!provider_session_id) {
          return Response.json({ error: 'Session ID not found in webhook payload' }, { status: 400 });
        }
        
        // Find the verification session
        const sessions = await base44.entities.IdentityVerificationSession.filter({
          provider_session_id
        });
        
        if (sessions.length === 0) {
          return Response.json({ error: 'Verification session not found' }, { status: 404 });
        }
        
        const session = sessions[0];
        
        // Update session with provider result
        await base44.entities.IdentityVerificationSession.update(session.id, {
          status: mapProviderStatus(status),
          provider_raw_result_json: JSON.stringify(result),
          completed_at: ['approved', 'declined', 'rejected'].includes(status) ? new Date().toISOString() : null
        });
        
        // Create audit log
        await base44.entities.AuditLog.create({
          entity_type: 'IdentityVerificationSession',
          entity_id: session.id,
          actor_id: 'system',
          actor_role: 'webhook',
          action: 'provider_webhook_received',
          changes_json: JSON.stringify({
            provider,
            provider_session_id,
            old_status: session.status,
            new_status: status,
            webhook_received_at: new Date().toISOString()
          }),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });
        
        return Response.json({
          success: true,
          message: 'Webhook processed successfully',
          session_id: session.id
        });
      }
      
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Check if provider is configured (has required secrets)
async function checkProviderConfigured(provider) {
  const requiredSecrets = {
    veriff: ['VERIFF_API_KEY', 'VERIFF_SECRET_KEY'],
    sumsub: ['SUMSUB_ACCESS_TOKEN', 'SUMSUB_APP_TOKEN'],
    onfido: ['ONFIDO_API_TOKEN'],
    stripe_identity: ['STRIPE_SECRET_KEY'],
    persona: ['PERSONA_API_KEY'],
    jumio: ['JUMIO_API_TOKEN', 'JUMIO_API_SECRET'],
    idenfy: ['IDENFY_API_KEY', 'IDENFY_API_SECRET']
  };
  
  const secrets = requiredSecrets[provider];
  if (!secrets) return false;
  
  for (const secretName of secrets) {
    const secret = Deno.env.get(secretName);
    if (!secret) return false;
  }
  
  return true;
}

// Verify provider signature (provider-specific implementation)
async function verifyProviderSignature(provider, req, payload) {
  // FUTURE: Implement provider-specific signature verification
  // Examples:
  // - Veriff: HMAC-SHA256 with secret key
  // - Sumsub: HMAC-SHA256 with access token
  // - Stripe: stripe-signature header
  // - Onfido: JWT token verification
  
  // For now, return false (not implemented)
  return false;
}

// Parse provider-specific webhook payload
async function parseProviderWebhookPayload(provider, payload) {
  // FUTURE: Implement provider-specific payload parsing
  // Each provider has different webhook payload structures
  
  // Example structure (provider-specific):
  return {
    provider_session_id: payload.session_id || payload.id,
    status: payload.status || payload.review_status,
    result: payload // Store full result for admin review
  };
}

// Map provider status to internal status
function mapProviderStatus(providerStatus) {
  const statusMap = {
    // Veriff
    'approved': 'approved',
    'declined': 'declined',
    'pending': 'pending',
    
    // Sumsub
    'completed': 'completed',
    'inProgress': 'pending',
    'rejected': 'declined',
    
    // Onfido
    'approved': 'approved',
    'consider': 'needs_review',
    'rejected': 'declined',
    
    // Generic
    'verified': 'approved',
    'failed': 'declined',
    'expired': 'expired'
  };
  
  return statusMap[providerStatus] || 'needs_review';
}