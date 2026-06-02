import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Performer-side: Update safe contact info fields
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    // Get authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find performer linked to this user
    const performers = await base44.asServiceRole.entities.Performer.filter({
      user_id: user.id
    });

    if (!performers || performers.length === 0) {
      return Response.json({ error: 'No performer profile linked to your account' }, { status: 404 });
    }

    const performer = performers[0];

    // Safe fields that can be updated directly
    const { phone, preferred_language, timezone, bio } = body;

    // Get or create private profile
    const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({
      performer_id: performer.id
    });

    let profile;
    if (profiles && profiles.length > 0) {
      profile = profiles[0];
    } else {
      // Create new profile
      profile = await base44.asServiceRole.entities.PerformerProfilePrivate.create({
        performer_id: performer.id
      });
    }

    // Update safe fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (phone !== undefined) updateData.phone = phone;
    if (preferred_language !== undefined) updateData.preferred_language = preferred_language;
    if (timezone !== undefined) updateData.timezone = timezone;

    await base44.asServiceRole.entities.PerformerProfilePrivate.update(profile.id, updateData);

    // Update bio on main performer record if provided
    if (bio !== undefined) {
      await base44.asServiceRole.entities.Performer.update(performer.id, { bio });
    }

    return Response.json({
      success: true,
      message: 'Contact information updated successfully'
    });
  } catch (error) {
    console.error('updatePerformerContactInfo error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});