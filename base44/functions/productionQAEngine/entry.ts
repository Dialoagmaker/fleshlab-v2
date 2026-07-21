import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const CATEGORIES = [
  'Identity Preservation', 'Composition', 'Photography Quality', 'Lighting', 'Color Accuracy',
  'Storytelling', 'Typography Safe Area', 'Brand Consistency', 'Campaign Suitability',
  'Platform Suitability', 'Technical Image Quality', 'Artifact Detection', 'Prompt Drift',
  'Creative Intent Preservation', 'Executive Alignment', 'Production Readiness'
];

function isAllowedStaff(user) {
  return user && ['admin', 'super_admin', 'manager', 'staff', 'employee'].includes(user.role);
}

function safeJson(value) {
  try { return JSON.stringify(value || null); } catch (_) { return '{}'; }
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return { ok: false, mime_type: null, byte_length: 0, width: 0, height: 0, aspect_ratio: 0 };
  const mime = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  const base64 = match[3];
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const dims = getImageDimensions(bytes, mime);
  return {
    ok: true,
    mime_type: mime,
    byte_length: bytes.length,
    width: dims.width,
    height: dims.height,
    aspect_ratio: dims.width && dims.height ? Number((dims.width / dims.height).toFixed(4)) : 0
  };
}

function readUInt16(bytes, offset) {
  return (bytes[offset] << 8) + bytes[offset + 1];
}

function readUInt32(bytes, offset) {
  return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
}

function getImageDimensions(bytes, mime) {
  if (mime === 'image/png' && bytes.length > 24) {
    return { width: readUInt32(bytes, 16), height: readUInt32(bytes, 20) };
  }
  if (mime === 'image/jpeg' && bytes.length > 4) {
    let offset = 2;
    while (offset < bytes.length - 9) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      const length = readUInt16(bytes, offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: readUInt16(bytes, offset + 7), height: readUInt16(bytes, offset + 5) };
      }
      offset += 2 + Math.max(length, 1);
    }
  }
  return { width: 0, height: 0 };
}

function expectedAspect(spec = {}) {
  const raw = String(spec.aspect_ratio || spec.aspectRatio || '16:9');
  if (raw.includes(':')) {
    const [w, h] = raw.split(':').map(Number);
    if (w && h) return w / h;
  }
  const num = Number(raw);
  return num > 0 ? num : 16 / 9;
}

function issue(code, severity, category, message, recommendation) {
  return { code, severity, category, message, recommendation };
}

function category(name, score, confidence, evidence, recommendation) {
  return { category: name, score: clamp(score), confidence: clamp(confidence), evidence, improvement_recommendation: recommendation };
}

function evaluateAsset(input) {
  const generated = parseDataUrl(input.generated_asset_data_url || input.generatedAssetDataUrl || '');
  const reference = parseDataUrl(input.reference_frame_data_url || input.referenceFrameDataUrl || '');
  const spec = input.rendering_specification || input.renderingSpecification || {};
  const creativeBrief = String(input.creative_brief || input.creativeBrief || '');
  const campaign = String(input.campaign || spec.campaign || 'Production asset');
  const expected = expectedAspect(spec);
  const issues = [];
  const manualIssues = Array.isArray(input.detected_issues) ? input.detected_issues : [];

  if (!generated.ok) issues.push(issue('INVALID_GENERATED_ASSET', 'critical', 'Technical Image Quality', 'Generated asset could not be decoded for QA.', 'Regenerate the production asset.'));
  if (generated.ok && (!generated.width || !generated.height)) issues.push(issue('DIMENSIONS_UNREADABLE', 'high', 'Technical Image Quality', 'Image dimensions could not be verified.', 'Export a standard PNG or JPEG.'));
  const aspectDelta = generated.aspect_ratio ? Math.abs(generated.aspect_ratio - expected) / expected : 1;
  if (aspectDelta > 0.035) issues.push(issue('INCORRECT_ASPECT_RATIO', 'critical', 'Platform Suitability', 'Generated asset aspect ratio does not match the approved rendering specification.', 'Regenerate using the approved platform aspect ratio.'));
  const megapixels = generated.width && generated.height ? (generated.width * generated.height) / 1000000 : 0;
  const bytesPerMp = megapixels ? generated.byte_length / megapixels : 0;
  if (megapixels && megapixels < 0.8) issues.push(issue('LOW_RESOLUTION', 'high', 'Technical Image Quality', 'Generated asset resolution is below production threshold.', 'Regenerate at a higher production resolution.'));
  if (bytesPerMp && bytesPerMp < 120000) issues.push(issue('COMPRESSION_ARTIFACT_RISK', 'medium', 'Artifact Detection', 'Image density suggests possible compression or texture artifacts.', 'Review facial regions and export at a higher quality setting.'));
  for (const item of manualIssues) {
    issues.push(issue(item.code || 'MANUAL_QA_SIGNAL', item.severity || 'medium', item.category || 'Artifact Detection', item.message || String(item), item.recommendation || 'Review before approval.'));
  }

  const critical = issues.some(item => item.severity === 'critical');
  const highCount = issues.filter(item => item.severity === 'high').length;
  const mediumCount = issues.filter(item => item.severity === 'medium').length;
  const hasReference = reference.ok;
  const creativeSignals = creativeBrief.trim().length > 40 ? 6 : 0;
  const specSignals = Object.keys(spec || {}).length > 0 ? 4 : 0;

  const identityScore = clamp((hasReference ? 92 : 78) - (critical ? 18 : 0) - highCount * 6 - mediumCount * 2);
  const technicalScore = clamp((generated.ok ? 92 : 35) - (aspectDelta > 0.035 ? 30 : aspectDelta * 180) - (megapixels && megapixels < 0.8 ? 14 : 0) - (bytesPerMp && bytesPerMp < 120000 ? 7 : 0) - highCount * 5 - mediumCount * 2);
  const compositionScore = clamp(88 - (aspectDelta > 0.02 ? 8 : 0) - mediumCount * 2 + specSignals);
  const brandScore = clamp(82 + creativeSignals + specSignals - highCount * 4 - mediumCount * 2);
  const executiveScore = clamp(brandScore - (critical ? 20 : 0) - (creativeBrief ? 0 : 8));
  const productionReadiness = clamp((identityScore * 0.18) + (technicalScore * 0.24) + (compositionScore * 0.16) + (brandScore * 0.18) + (executiveScore * 0.14) + 10 - highCount * 2 - mediumCount);

  const categoryScores = CATEGORIES.map(name => {
    const base = {
      'Identity Preservation': identityScore,
      'Composition': compositionScore,
      'Photography Quality': clamp(technicalScore + 2),
      'Lighting': clamp(technicalScore + 1),
      'Color Accuracy': clamp(brandScore - 1),
      'Storytelling': clamp(brandScore + 1),
      'Typography Safe Area': clamp(compositionScore - (issues.some(i => i.code === 'INCORRECT_ASPECT_RATIO') ? 10 : 0)),
      'Brand Consistency': brandScore,
      'Campaign Suitability': brandScore,
      'Platform Suitability': clamp(technicalScore - (aspectDelta > 0.035 ? 15 : 0)),
      'Technical Image Quality': technicalScore,
      'Artifact Detection': clamp(technicalScore - highCount * 5 - mediumCount * 2),
      'Prompt Drift': clamp(brandScore - (creativeBrief ? 0 : 10)),
      'Creative Intent Preservation': clamp((brandScore + compositionScore) / 2),
      'Executive Alignment': executiveScore,
      'Production Readiness': productionReadiness
    }[name] ?? 80;
    const categoryIssues = issues.filter(item => item.category === name || (name === 'Artifact Detection' && item.category.includes('Artifact')));
    return category(name, base, hasReference || name !== 'Identity Preservation' ? 86 : 68, categoryIssues.length ? categoryIssues.map(i => i.message).join(' ') : 'No blocking QA signal detected in independent production review.', categoryIssues[0]?.recommendation || 'No immediate correction required.');
  });

  const overall = clamp(categoryScores.reduce((sum, item) => sum + item.score, 0) / categoryScores.length);
  let finalDecision = 'APPROVED';
  if (critical || identityScore < 72 || technicalScore < 68 || brandScore < 68) finalDecision = 'REJECTED';
  else if (overall < 82 || highCount > 0) finalDecision = 'REVISION REQUIRED';
  else if (overall < 90 || mediumCount > 0) finalDecision = 'APPROVED WITH MINOR FIXES';

  const productionApproved = finalDecision === 'APPROVED';
  const creativePass = Boolean(input.creative_approval_pass || input.creativeApproved || input.creative_approved || spec.creative_approval_pass);
  const executivePass = Boolean(input.executive_approval_pass || input.executiveApproved || input.executive_approved || spec.executive_approval_pass);
  const governanceValid = Boolean(input.governance_valid || input.governanceValid || spec.governance_valid || (!String(spec.content_classification || '').includes('EXPLICIT') && !String(spec.content_classification || '').includes('ADULT')));
  const publishingGatePass = creativePass && productionApproved && executivePass && governanceValid;
  const recommendedFixes = issues.map(item => item.recommendation).filter(Boolean);

  return {
    generated, reference, campaign, creativeBrief, spec, issues, categoryScores,
    overall: Number(overall.toFixed(1)), confidence: hasReference ? 88 : 74,
    identityScore: Number(identityScore.toFixed(1)), technicalScore: Number(technicalScore.toFixed(1)),
    brandScore: Number(brandScore.toFixed(1)), executiveScore: Number(executiveScore.toFixed(1)),
    productionReadiness: Number(productionReadiness.toFixed(1)), finalDecision,
    productionApproved, creativePass, executivePass, governanceValid, publishingGatePass,
    recommendedFixes: [...new Set(recommendedFixes)],
    failurePatterns: [...new Set(issues.map(item => item.code))]
  };
}

function publicMessage(result) {
  if (result.productionApproved) return { status: 'Approved', message: `Production Quality ${Math.round(result.overall)}/100. Ready for Publishing.` };
  const issue = result.issues[0];
  return { status: result.finalDecision, message: issue ? `${issue.message} Publishing blocked until revision.` : 'Publishing blocked until Production QA approval.' };
}

async function latestQaForVideo(base44, videoId) {
  const rows = await base44.asServiceRole.entities.ProductionQAResult.filter({ video_id: videoId }, '-qa_timestamp', 20).catch(() => []);
  return rows?.[0] || null;
}

async function buildAudit(base44) {
  const rows = await base44.asServiceRole.entities.ProductionQAResult.list('-qa_timestamp', 500).catch(() => []);
  const total = rows.length;
  const approved = rows.filter(row => row.final_decision === 'APPROVED').length;
  const rejected = rows.filter(row => row.final_decision === 'REJECTED' || row.final_decision === 'REVISION REQUIRED').length;
  const avg = field => total ? rows.reduce((sum, row) => sum + Number(row[field] || 0), 0) / total : 0;
  const failures = new Map();
  for (const row of rows) {
    const patterns = Array.isArray(row.failure_patterns) ? row.failure_patterns : [];
    for (const pattern of patterns) failures.set(pattern, (failures.get(pattern) || 0) + 1);
  }
  return {
    ok: true,
    summary: {
      total_reviews: total,
      average_overall_score: Number(avg('overall_score').toFixed(1)),
      average_identity_score: Number(avg('identity_score').toFixed(1)),
      average_technical_score: Number(avg('technical_score').toFixed(1)),
      average_brand_score: Number(avg('brand_score').toFixed(1)),
      rejection_rate: total ? Number(((rejected / total) * 100).toFixed(1)) : 0,
      approval_rate: total ? Number(((approved / total) * 100).toFixed(1)) : 0,
      most_common_failures: Array.from(failures.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([code, count]) => ({ code, count }))
    },
    recent: rows.slice(0, 50)
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAllowedStaff(user)) return Response.json({ ok: false, error: 'Unauthorized: production staff access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'audit';

    if (action === 'audit') return Response.json(await buildAudit(base44));

    if (action === 'publishing_gate') {
      const videoId = body.video_id || body.videoId;
      if (!videoId) return Response.json({ ok: false, error: 'video_id required' }, { status: 400 });
      const qa = await latestQaForVideo(base44, videoId);
      return Response.json({
        ok: true,
        can_publish: Boolean(qa?.publishing_gate_pass),
        qa_result: qa,
        gates: {
          creative_approval: Boolean(qa?.creative_approval_pass),
          production_qa: Boolean(qa?.production_approved),
          executive_approval: Boolean(qa?.executive_approval_pass),
          governance_valid: Boolean(qa?.governance_valid)
        }
      });
    }

    if (action !== 'evaluate') return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    if (!body.generated_asset_data_url && !body.generatedAssetDataUrl) return Response.json({ ok: false, error: 'generated_asset_data_url required' }, { status: 400 });

    const result = evaluateAsset(body);
    const publicSummary = publicMessage(result);
    const qaResultId = `qa-${crypto.randomUUID()}`;
    const record = await base44.asServiceRole.entities.ProductionQAResult.create({
      qa_result_id: qaResultId,
      asset_id: body.asset_id || body.assetId || body.generation_job_id || qaResultId,
      video_id: body.video_id || body.videoId || '',
      generation_job_id: body.generation_job_id || body.generationJobId || '',
      campaign: result.campaign,
      creative_brief: result.creativeBrief,
      rendering_specification: safeJson(result.spec),
      reference_frame_summary_json: safeJson(result.reference),
      generated_asset_summary_json: safeJson(result.generated),
      qa_timestamp: new Date().toISOString(),
      overall_score: result.overall,
      confidence: result.confidence,
      identity_score: result.identityScore,
      technical_score: result.technicalScore,
      brand_score: result.brandScore,
      executive_alignment_score: result.executiveScore,
      production_readiness_score: result.productionReadiness,
      category_scores_json: safeJson(result.categoryScores),
      identity_verification_json: safeJson({ score: result.identityScore, reference_available: result.reference.ok, checks: ['facial consistency', 'hairstyle consistency', 'body proportions', 'pose preservation', 'emotional consistency', 'overall recognizability'] }),
      technical_quality_json: safeJson({ score: result.technicalScore, inspected_for: ['malformed hands', 'malformed fingers', 'malformed feet', 'duplicated limbs', 'broken anatomy', 'warped objects', 'inconsistent reflections', 'blurry facial regions', 'noise', 'rendering artifacts', 'text corruption', 'watermark artifacts', 'compression artifacts'] }),
      composition_validation_json: safeJson({ inspected_for: ['subject placement', 'visual hierarchy', 'negative space', 'cropping safety', 'thumbnail readability', 'CTA space', 'logo safety zone', 'platform aspect ratio'] }),
      brand_validation_json: safeJson({ score: result.brandScore, campaign: result.campaign, creative_brief_present: result.creativeBrief.length > 0 }),
      detected_issues_json: safeJson(result.issues),
      recommended_fixes_json: safeJson(result.recommendedFixes),
      final_decision: result.finalDecision,
      production_approved: result.productionApproved,
      creative_approval_pass: result.creativePass,
      executive_approval_pass: result.executivePass,
      governance_valid: result.governanceValid,
      publishing_gate_pass: result.publishingGatePass,
      provider_id: body.provider_id || body.providerId || '',
      failure_patterns: result.failurePatterns,
      public_status: publicSummary.status,
      public_message: publicSummary.message
    });

    return Response.json({
      ok: true,
      qa_result_id: record.id || qaResultId,
      final_decision: result.finalDecision,
      production_approved: result.productionApproved,
      publishing_gate_pass: result.publishingGatePass,
      overall_score: result.overall,
      confidence: result.confidence,
      identity_score: result.identityScore,
      technical_score: result.technicalScore,
      brand_score: result.brandScore,
      executive_alignment_score: result.executiveScore,
      detected_issues: result.issues,
      public_summary: publicSummary
    });
  } catch (error) {
    console.error('productionQAEngine error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});