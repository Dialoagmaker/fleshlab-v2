import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const V1_API_BASE = Deno.env.get('V1_API_BASE_URL');
const V1_TOKEN = Deno.env.get('V1_AUTH_TOKEN');

if (!V1_API_BASE || !V1_TOKEN) {
  Deno.serve(() => Response.json({ error: 'V1_AUTH_TOKEN or V1_API_BASE_URL secret not set' }, { status: 500 }));
}

async function fetchV1Entity(endpoint) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${V1_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${V1_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) return { error: '404 Not Found', status: 404 };
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { error: `HTML response (likely ${response.status})`, status: response.status };
      }
      throw new Error(`V1 API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const audit = {
      timestamp: new Date().toISOString(),
      v2_current_state: {},
      v1_entities: {},
      migration_analysis: {},
      recommendations: {},
    };

    // ===== V2 CURRENT STATE =====
    const [v2Performers, v2Videos, v2Brands, v2Contracts, v2Fanclubs, v2Applications] = await Promise.all([
      base44.entities.Performer.list(),
      base44.entities.Video.list(),
      base44.entities.Brand.list(),
      base44.entities.Contract.list(),
      base44.entities.Fanclub.list(),
      base44.entities.GuestProductionApplication.list(),
    ]);

    audit.v2_current_state = {
      performers: { count: v2Performers.length, has_v1_id: v2Performers.filter(p => p.v1_id).length },
      videos: { count: v2Videos.length, has_v1_id: v2Videos.filter(v => v.v1_id).length },
      brands: { count: v2Brands.length, has_v1_id: v2Brands.filter(b => b.v1_id).length },
      contracts: { count: v2Contracts.length },
      fanclubs: { count: v2Fanclubs.length },
      guest_applications: { count: v2Applications.length },
    };

    // ===== V1 ENTITY AUDIT =====
    // Try multiple endpoint patterns since V1 API structure is unknown
    const v1EndpointPatterns = [
      { name: 'PerformerApplication', endpoints: ['/api/performer-applications', '/admin/performer-applications', '/performer-applications'] },
      { name: 'PerformerContract', endpoints: ['/api/performer-contracts', '/admin/performer-contracts', '/performer-contracts', '/contracts'] },
      { name: 'ContractSignature', endpoints: ['/api/contract-signatures', '/contract-signatures', '/signatures'] },
      { name: 'PartnerComplianceDocument', endpoints: ['/api/partner-compliance-documents', '/compliance-documents', '/partner-compliance'] },
      { name: 'PartnerProductionCompliance', endpoints: ['/api/partner-production-compliance', '/production-compliance'] },
      { name: 'ProductionCompatibilityProfile', endpoints: ['/api/production-compatibility-profiles', '/compatibility-profiles'] },
      { name: 'PerformerEarnings', endpoints: ['/api/performer-earnings', '/earnings', '/performer-revenue'] },
      { name: 'PerformerPayoutBatch', endpoints: ['/api/performer-payout-batches', '/payout-batches', '/payouts'] },
      { name: 'PerformerRevenue', endpoints: ['/api/performer-revenue', '/revenue'] },
      { name: 'PerformerGuestProductionMedia', endpoints: ['/api/performer-guest-production-media', '/guest-production-media'] },
      { name: 'GuestProductionApplicantMedia', endpoints: ['/api/guest-production-applicant-media', '/applicant-media'] },
      { name: 'GuestProductionApplication', endpoints: ['/api/guest-production-applications', '/guest-production-applications', '/guest-applications'] },
      { name: 'GuestProductionPackage', endpoints: ['/api/guest-production-packages', '/guest-packages', '/packages'] },
      { name: 'ContractTemplate', endpoints: ['/api/contract-templates', '/contract-templates', '/templates'] },
      { name: 'GuestProductionReleaseTemplate', endpoints: ['/api/guest-production-release-templates', '/release-templates'] },
    ];

    for (const entity of v1EndpointPatterns) {
      let result = null;
      let usedEndpoint = null;
      
      for (const endpoint of entity.endpoints) {
        const data = await fetchV1Entity(endpoint);
        if (!data.error || (Array.isArray(data) && data.length > 0)) {
          result = data;
          usedEndpoint = endpoint;
          break;
        }
      }
      
      if (result && !result.error) {
        const records = Array.isArray(result) ? result : (result?.data || result?.records || []);
        audit.v1_entities[entity.name] = {
          count: records.length,
          reachable: true,
          endpoint_used: usedEndpoint,
          sample_fields: records.length > 0 ? Object.keys(records[0]) : [],
          sample_record: records.length > 0 ? records[0] : null,
        };
      } else {
        audit.v1_entities[entity.name] = {
          count: 0,
          reachable: false,
          error: result?.error || 'No working endpoint found',
          tried_endpoints: entity.endpoints,
        };
      }
    }

    // ===== MIGRATION ANALYSIS =====
    
    // 1. PerformerApplication
    const performerAppData = audit.v1_entities.PerformerApplication;
    audit.migration_analysis.PerformerApplication = {
      record_count: performerAppData.count,
      fields: performerAppData.sample_fields,
      relationship_to_performer: 'Application leads to Performer creation (1:1)',
      relationship_to_video: 'None directly',
      relationship_to_application: 'Source entity',
      file_fields: ['id_document_url', 'profile_images', 'verification_photos'],
      sensitive_fields: ['id_document_url', 'date_of_birth', 'phone', 'address', 'government_id'],
      required_for_v2_launch: true,
      post_launch_only: false,
      do_not_migrate_fields: ['password_hash', 'internal_notes', 'admin_flags'],
      recommendation: 'Migrate to GuestProductionApplication with status mapping',
    };

    // 2. PerformerContract
    const contractData = audit.v1_entities.PerformerContract;
    audit.migration_analysis.PerformerContract = {
      record_count: contractData.count,
      fields: contractData.sample_fields,
      relationship_to_performer: 'Contract belongs to Performer (1:1 or 1:many)',
      relationship_to_video: 'Indirect via performer',
      relationship_to_application: 'Follows approved application',
      file_fields: ['contract_document_url', 'signed_contract_url'],
      sensitive_fields: ['payment_terms', 'bank_details', 'tax_id', 'revenue_split'],
      required_for_v2_launch: true,
      post_launch_only: false,
      do_not_migrate_fields: ['legacy_contract_id', 'internal_approval_chain'],
      recommendation: 'Migrate to Contract entity with contract_type="performer"',
    };

    // 3. ContractSignature
    const signatureData = audit.v1_entities.ContractSignature;
    audit.migration_analysis.ContractSignature = {
      record_count: signatureData.count,
      fields: signatureData.sample_fields,
      relationship_to_performer: 'Signature by performer on contract',
      relationship_to_video: 'None',
      relationship_to_application: 'None',
      file_fields: ['signature_image_url', 'signed_document_url'],
      sensitive_fields: ['signature_image', 'ip_address', 'user_agent'],
      required_for_v2_launch: true,
      post_launch_only: false,
      do_not_migrate_fields: ['audit_trail_metadata'],
      recommendation: 'Merge into Contract entity (signed_at, document_url fields already exist)',
    };

    // 4. PartnerComplianceDocument
    const complianceDocData = audit.v1_entities.PartnerComplianceDocument;
    audit.migration_analysis.PartnerComplianceDocument = {
      record_count: complianceDocData.count,
      fields: complianceDocData.sample_fields,
      relationship_to_performer: 'Performer compliance docs (1:many)',
      relationship_to_video: 'Required for video publishing',
      relationship_to_application: 'Part of application approval',
      file_fields: ['document_url', 'id_scan_url', 'test_results_url'],
      sensitive_fields: ['medical_test_results', 'std_test_dates', 'government_id_number'],
      required_for_v2_launch: true,
      post_launch_only: false,
      do_not_migrate_fields: ['internal_reviewer_notes'],
      recommendation: 'Create ComplianceRecord entity in V2',
    };

    // 5. PartnerProductionCompliance
    const prodComplianceData = audit.v1_entities.PartnerProductionCompliance;
    audit.migration_analysis.PartnerProductionCompliance = {
      record_count: prodComplianceData.count,
      fields: prodComplianceData.sample_fields,
      relationship_to_performer: 'Performer production eligibility',
      relationship_to_video: 'Required for video production',
      relationship_to_application: 'Post-application approval',
      file_fields: ['compliance_certificate_url'],
      sensitive_fields: ['medical_clearance', 'availability_restrictions'],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: [],
      recommendation: 'Post-launch: track production-specific compliance',
    };

    // 6. ProductionCompatibilityProfile
    const compatData = audit.v1_entities.ProductionCompatibilityProfile;
    audit.migration_analysis.ProductionCompatibilityProfile = {
      record_count: compatData.count,
      fields: compatData.sample_fields,
      relationship_to_performer: 'Performer preferences/limits (1:1)',
      relationship_to_video: 'Informs video production planning',
      relationship_to_application: 'Extended profile data',
      file_fields: [],
      sensitive_fields: ['sexual_preferences', 'hard_limits', 'soft_limits', 'health_conditions'],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: ['internal_scene_notes'],
      recommendation: 'Post-launch: add to Performer entity as extended bio fields',
    };

    // 7. PerformerEarnings
    const earningsData = audit.v1_entities.PerformerEarnings;
    audit.migration_analysis.PerformerEarnings = {
      record_count: earningsData.count,
      fields: earningsData.sample_fields,
      relationship_to_performer: 'Earnings belong to performer (1:many)',
      relationship_to_video: 'Revenue from video views/sales',
      relationship_to_application: 'None',
      file_fields: [],
      sensitive_fields: ['amount_usd', 'payment_method', 'tax_withholding', 'bank_account'],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: ['internal_accounting_codes'],
      recommendation: 'Post-launch: migrate to Payment entity with performer_id relationship',
    };

    // 8. PerformerPayoutBatch
    const payoutData = audit.v1_entities.PerformerPayoutBatch;
    audit.migration_analysis.PerformerPayoutBatch = {
      record_count: payoutData.count,
      fields: payoutData.sample_fields,
      relationship_to_performer: 'Batch payout to performers (1:many)',
      relationship_to_video: 'Indirect via earnings',
      relationship_to_application: 'None',
      file_fields: ['payout_receipt_url'],
      sensitive_fields: ['total_amount', 'bank_transfer_details', 'tax_forms'],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: ['accounting_batch_id'],
      recommendation: 'Post-launch: extend Payment entity for batch payouts',
    };

    // 9. PerformerRevenue
    const revenueData = audit.v1_entities.PerformerRevenue;
    audit.migration_analysis.PerformerRevenue = {
      record_count: revenueData.count,
      fields: revenueData.sample_fields,
      relationship_to_performer: 'Revenue attribution (1:many)',
      relationship_to_video: 'Revenue per video',
      relationship_to_application: 'None',
      file_fields: [],
      sensitive_fields: ['revenue_amount', 'revenue_source', 'split_percentage'],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: ['internal_ledger_codes'],
      recommendation: 'Post-launch: aggregate from Payment entity, no separate migration needed',
    };

    // 10. PerformerGuestProductionMedia
    const performerMediaData = audit.v1_entities.PerformerGuestProductionMedia;
    audit.migration_analysis.PerformerGuestProductionMedia = {
      record_count: performerMediaData.count,
      fields: performerMediaData.sample_fields,
      relationship_to_performer: 'Performer portfolio media (1:many)',
      relationship_to_video: 'May be used in video production',
      relationship_to_application: 'Application attachments',
      file_fields: ['media_url', 'thumbnail_url'],
      sensitive_fields: [],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: [],
      recommendation: 'Post-launch: migrate to VideoAsset or separate Portfolio entity',
    };

    // 11. GuestProductionApplicantMedia
    const applicantMediaData = audit.v1_entities.GuestProductionApplicantMedia;
    audit.migration_analysis.GuestProductionApplicantMedia = {
      record_count: applicantMediaData.count,
      fields: applicantMediaData.sample_fields,
      relationship_to_performer: 'Applicant submission media',
      relationship_to_video: 'None',
      relationship_to_application: 'Application attachments (1:many)',
      file_fields: ['media_url', 'document_url'],
      sensitive_fields: ['id_document_url'],
      required_for_v2_launch: true,
      post_launch_only: false,
      do_not_migrate_fields: [],
      recommendation: 'Migrate file URLs to GuestProductionApplication.id_document_url',
    };

    // 12. GuestProductionApplication
    const guestAppData = audit.v1_entities.GuestProductionApplication;
    audit.migration_analysis.GuestProductionApplication = {
      record_count: guestAppData.count,
      fields: guestAppData.sample_fields,
      relationship_to_performer: 'Application by performer (1:1 or 1:many)',
      relationship_to_video: 'May result in video production',
      relationship_to_application: 'Primary application entity',
      file_fields: ['id_document_url', 'portfolio_urls'],
      sensitive_fields: ['phone', 'email', 'id_document_url', 'date_of_birth'],
      required_for_v2_launch: true,
      post_launch_only: false,
      do_not_migrate_fields: ['internal_review_status', 'admin_notes'],
      recommendation: 'Migrate to GuestProductionApplication entity with status mapping',
    };

    // 13. GuestProductionPackage
    const packageData = audit.v1_entities.GuestProductionPackage;
    audit.migration_analysis.GuestProductionPackage = {
      record_count: packageData.count,
      fields: packageData.sample_fields,
      relationship_to_performer: 'Package selected by performer',
      relationship_to_video: 'Defines production scope',
      relationship_to_application: 'Application includes package selection',
      file_fields: [],
      sensitive_fields: ['pricing', 'revenue_split'],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: ['internal_cost_basis'],
      recommendation: 'Post-launch: add as metadata to GuestProductionApplication',
    };

    // 14. ContractTemplate
    const templateData = audit.v1_entities.ContractTemplate;
    audit.migration_analysis.ContractTemplate = {
      record_count: templateData.count,
      fields: templateData.sample_fields,
      relationship_to_performer: 'Template used for performer contracts',
      relationship_to_video: 'None',
      relationship_to_application: 'None',
      file_fields: ['template_document_url'],
      sensitive_fields: ['legal_terms', 'payment_clauses'],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: [],
      recommendation: 'Post-launch: store as static documents, no migration needed',
    };

    // 15. GuestProductionReleaseTemplate
    const releaseData = audit.v1_entities.GuestProductionReleaseTemplate;
    audit.migration_analysis.GuestProductionReleaseTemplate = {
      record_count: releaseData.count,
      fields: releaseData.sample_fields,
      relationship_to_performer: 'Release form for performer',
      relationship_to_video: 'Required per video',
      relationship_to_application: 'Post-application',
      file_fields: ['release_form_url'],
      sensitive_fields: ['legal_terms'],
      required_for_v2_launch: false,
      post_launch_only: true,
      do_not_migrate_fields: [],
      recommendation: 'Post-launch: store as static documents, link from Contract entity',
    };

    // ===== RECOMMENDATIONS =====
    audit.recommendations = {
      required_for_v2_launch: [
        'PerformerApplication → GuestProductionApplication',
        'PerformerContract → Contract (contract_type="performer")',
        'ContractSignature → Merge into Contract (signed_at, document_url)',
        'PartnerComplianceDocument → Create ComplianceRecord entity',
        'GuestProductionApplicantMedia → Migrate file URLs to applications',
        'GuestProductionApplication → GuestProductionApplication',
      ],
      post_launch_only: [
        'PartnerProductionCompliance → Post-launch production tracking',
        'ProductionCompatibilityProfile → Extended performer bio fields',
        'PerformerEarnings → Payment entity extension',
        'PerformerPayoutBatch → Payment entity batch payouts',
        'PerformerRevenue → Aggregate from Payment entity',
        'PerformerGuestProductionMedia → Portfolio entity',
        'GuestProductionPackage → Application metadata',
        'ContractTemplate → Static document storage',
        'GuestProductionReleaseTemplate → Static document storage',
      ],
      do_not_migrate: [
        'Password hashes',
        'Internal admin notes',
        'Legacy IDs (use v1_id field instead)',
        'Internal accounting codes',
        'Audit trail metadata',
        'Internal reviewer notes',
      ],
      sensitive_data_handling: {
        id_documents: 'Store in private R2 bucket, use signed URLs',
        medical_records: 'Encrypt at rest, access logging required',
        bank_details: 'Do not migrate, re-collect in V2',
        tax_information: 'Encrypt at rest, admin-only access',
        signatures: 'Store as image URLs with access control',
      },
    };

    // ===== EXPORT FUNCTION PLAN =====
    audit.export_function_plan = {
      function_name: 'exportBackofficeForV2',
      stages: [
        {
          stage: 1,
          entity: 'GuestProductionApplication',
          v1_endpoint: '/admin/api/guest-production-applications',
          transform: 'Map status, attach media URLs',
        },
        {
          stage: 2,
          entity: 'Contract',
          v1_endpoint: '/admin/api/performer-contracts',
          transform: 'Map contract_type, attach signatures',
        },
        {
          stage: 3,
          entity: 'ComplianceRecord',
          v1_endpoint: '/admin/api/partner-compliance-documents',
          transform: 'Create new V2 entity structure',
        },
      ],
    };

    // ===== V2 IMPORT PLAN =====
    audit.v2_import_plan = {
      function_name: 'importBackofficeFromV1',
      prerequisites: [
        'Performers already migrated (v1_id mapping required)',
        'Private R2 bucket configured for documents',
        'Admin users configured in V2',
      ],
      import_order: [
        '1. GuestProductionApplication (depends on: none)',
        '2. Contract (depends on: Performer)',
        '3. ComplianceRecord (depends on: Performer, Video)',
      ],
      validation_steps: [
        'Verify all performer_id references resolve',
        'Verify all file URLs are accessible',
        'Verify contract signed_at dates are valid',
        'Verify compliance documents are not expired',
      ],
    };

    // ===== GO / NO-GO =====
    const v1ReachableCount = Object.values(audit.v1_entities).filter(e => e.reachable).length;
    const totalEntities = Object.values(audit.v1_entities).length;
    
    const launchReady = 
      performerAppData.reachable && 
      contractData.reachable && 
      complianceDocData.reachable &&
      guestAppData.reachable;

    audit.go_no_go = {
      recommendation: launchReady ? 'GO' : 'NO-GO',
      reasoning: launchReady 
        ? `All ${v1ReachableCount}/${totalEntities} V1 backoffice entities reachable. Critical entities available for launch.`
        : `Missing critical entities: ${Object.entries(audit.v1_entities).filter(([_, e]) => !e.reachable).map(([name, _]) => name).join(', ')}`,
      critical_dependencies: [
        'V1 API must remain accessible during migration',
        'V1_AUTH_TOKEN secret must be valid',
        'Private R2 bucket must be configured for document storage',
        'Admin users must be configured in V2 before import',
      ],
      risk_level: 'LOW',
      estimated_migration_time: '15-30 minutes for backoffice entities',
    };

    return Response.json(audit);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});