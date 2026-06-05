/**
 * checkExternalProcessorHealth
 * 
 * Diagnostics function to check if the external video processor is reachable and healthy.
 * Tests multiple endpoints and returns detailed response information.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin-only
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const processorBaseUrl = Deno.env.get('PROCESSOR_WEBHOOK_URL');
    const processorApiKey = Deno.env.get('PROCESSOR_API_KEY');

    if (!processorBaseUrl) {
      return Response.json({ error: 'PROCESSOR_WEBHOOK_URL not configured' }, { status: 500 });
    }

    console.log('[checkExternalProcessorHealth] Starting health check...', { processorBaseUrl });

    const results = {
      processor_base_url: processorBaseUrl,
      timestamp: new Date().toISOString(),
      endpoints_tested: [],
      overall_status: 'unknown',
    };

    // Test 1: Root endpoint
    try {
      console.log('[checkExternalProcessorHealth] Testing root endpoint...');
      const rootResponse = await fetch(`${processorBaseUrl}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${processorApiKey}`,
        },
      });

      let rootBody;
      try {
        rootBody = await rootResponse.json();
      } catch {
        rootBody = await rootResponse.text();
      }

      results.endpoints_tested.push({
        endpoint: `${processorBaseUrl}/`,
        method: 'GET',
        http_status: rootResponse.status,
        http_status_text: rootResponse.statusText,
        response_body: rootBody,
        reachable: rootResponse.ok,
      });

      console.log('[checkExternalProcessorHealth] Root endpoint result:', {
        status: rootResponse.status,
        body: JSON.stringify(rootBody).substring(0, 200),
      });
    } catch (error) {
      results.endpoints_tested.push({
        endpoint: `${processorBaseUrl}/`,
        method: 'GET',
        error: error.message,
        reachable: false,
      });
      console.error('[checkExternalProcessorHealth] Root endpoint failed:', error);
    }

    // Test 2: Health endpoint
    try {
      console.log('[checkExternalProcessorHealth] Testing /health endpoint...');
      const healthResponse = await fetch(`${processorBaseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${processorApiKey}`,
        },
      });

      let healthBody;
      try {
        healthBody = await healthResponse.json();
      } catch {
        healthBody = await healthResponse.text();
      }

      results.endpoints_tested.push({
        endpoint: `${processorBaseUrl}/health`,
        method: 'GET',
        http_status: healthResponse.status,
        http_status_text: healthResponse.statusText,
        response_body: healthBody,
        reachable: healthResponse.ok,
      });

      console.log('[checkExternalProcessorHealth] Health endpoint result:', {
        status: healthResponse.status,
        body: JSON.stringify(healthBody).substring(0, 200),
      });
    } catch (error) {
      results.endpoints_tested.push({
        endpoint: `${processorBaseUrl}/health`,
        method: 'GET',
        error: error.message,
        reachable: false,
      });
      console.error('[checkExternalProcessorHealth] Health endpoint failed:', error);
    }

    // Test 3: Status endpoint
    try {
      console.log('[checkExternalProcessorHealth] Testing /status endpoint...');
      const statusResponse = await fetch(`${processorBaseUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${processorApiKey}`,
        },
      });

      let statusBody;
      try {
        statusBody = await statusResponse.json();
      } catch {
        statusBody = await statusResponse.text();
      }

      results.endpoints_tested.push({
        endpoint: `${processorBaseUrl}/status`,
        method: 'GET',
        http_status: statusResponse.status,
        http_status_text: statusResponse.statusText,
        response_body: statusBody,
        reachable: statusResponse.ok,
      });

      console.log('[checkExternalProcessorHealth] Status endpoint result:', {
        status: statusResponse.status,
        body: JSON.stringify(statusBody).substring(0, 200),
      });
    } catch (error) {
      results.endpoints_tested.push({
        endpoint: `${processorBaseUrl}/status`,
        method: 'GET',
        error: error.message,
        reachable: false,
      });
      console.error('[checkExternalProcessorHealth] Status endpoint failed:', error);
    }

    // Determine overall status
    const reachableEndpoints = results.endpoints_tested.filter(e => e.reachable);
    if (reachableEndpoints.length > 0) {
      results.overall_status = 'healthy';
    } else {
      results.overall_status = 'unreachable';
    }

    console.log('[checkExternalProcessorHealth] Complete:', results);

    return Response.json(results);

  } catch (error) {
    console.error('[checkExternalProcessorHealth] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});