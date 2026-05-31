import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SUBMIT PERFORMER APPLICATION
 * 
 * Creates a new GuestProductionApplication record from the public form.
 * Stores source metadata for V1 compatibility.
 */

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    
    const {
      applicant_name,
      email,
      phone,
      nationality,
      message,
      package_interest,
      id_document_url,
      status = "pending",
    } = payload;

    // Validate required fields
    if (!applicant_name || !email) {
      return Response.json({ error: "Name and email are required" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Create application with V2 source tracking
    const application = await base44.entities.GuestProductionApplication.create({
      applicant_name,
      email,
      phone,
      nationality,
      message,
      package_interest,
      id_document_url,
      status,
      submitted_at: new Date().toISOString(),
      admin_notes: `Source: become_performer\nPreferred Path: ${package_interest || 'Not specified'}`,
    });

    return Response.json({
      success: true,
      application_id: application.id,
      message: "Application submitted successfully",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});