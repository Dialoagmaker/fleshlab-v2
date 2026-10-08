import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function resolvePerformer(base44, body) {
  const { performer_id, performer_token } = body;
  if (performer_id && performer_token) {
    const sessions = await base44.asServiceRole.entities.PerformerSession.filter({
      performer_id, token: performer_token, revoked: false
    });
    if (!sessions || sessions.length === 0) return null;
    if (new Date(sessions[0].expires_at) < new Date()) return null;
    return base44.asServiceRole.entities.Performer.get(performer_id);
  }
  const user = await base44.auth.me();
  if (!user) return null;
  const performers = await base44.asServiceRole.entities.Performer.filter({ user_id: user.id });
  return performers?.[0] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const performer = await resolvePerformer(base44, body);
    if (!performer) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone, preferred_language, timezone, bio } = body;

    const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({ performer_id: performer.id });
    let profile;
    if (profiles && profiles.length > 0) {
      profile = profiles[0];
    } else {
      profile = await base44.asServiceRole.entities.PerformerProfilePrivate.create({ performer_id: performer.id });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (phone !== undefined) updateData.phone = phone;
    if (preferred_language !== undefined) updateData.preferred_language = preferred_language;
    if (timezone !== undefined) updateData.timezone = timezone;

    await base44.asServiceRole.entities.PerformerProfilePrivate.update(profile.id, updateData);

    if (bio !== undefined) {
      await base44.asServiceRole.entities.Performer.update(performer.id, { bio });
    }

    return Response.json({ success: true, message: 'Contact information updated successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});