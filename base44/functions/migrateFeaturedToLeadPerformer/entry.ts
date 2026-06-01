/**
 * Migration Script: Map VideoPerformer.featured → VideoPerformer.lead_performer
 * 
 * Run this ONCE after deploying the lead_performer field.
 * This script preserves the featured field for backward compatibility.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all VideoPerformer records
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({});

    if (!videoPerformers || videoPerformers.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No VideoPerformer records to migrate',
        migrated_count: 0
      });
    }

    let migratedCount = 0;
    let skippedCount = 0;

    // Migrate each record
    for (const vp of videoPerformers) {
      try {
        // Map featured → lead_performer
        const leadPerformer = vp.featured || false;

        // Only update if lead_performer field exists and is different
        if (vp.lead_performer !== leadPerformer) {
          const updateData = { lead_performer: leadPerformer };
          await base44.asServiceRole.entities.VideoPerformer.update(vp.id, updateData);
          migratedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Failed to migrate VideoPerformer ${vp.id}:`, error);
      }
    }

    // Log migration summary
    const summary = {
      total_records: videoPerformers.length,
      migrated: migratedCount,
      skipped: skippedCount,
      featured_field_preserved: true
    };

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      entity_type: 'VideoPerformer',
      entity_id: 'all',
      actor_id: user.id,
      actor_role: user.role,
      action: 'bulk_migration_featured_to_lead_performer',
      changes_json: JSON.stringify(summary),
      ip_address: null,
      notes: `Migration: featured → lead_performer. Migrated ${migratedCount}/${videoPerformers.length} records.`
    });

    return Response.json({
      success: true,
      message: 'Migration completed successfully',
      summary
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});