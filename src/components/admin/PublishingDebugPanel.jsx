import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { checkPublishReadiness } from "@/lib/publishReadinessGuardrails";
import { validateVideoCategories } from "@/lib/videoTaxonomy";

/**
 * Publishing Debug Panel
 * Shows detailed diagnostic info for why publishing is blocked
 */
export default function PublishingDebugPanel({ 
  video, 
  form, 
  selectedPerformerIds = [],
  sourceAssets = [],
  onRefresh 
}) {
  // Calculate publish readiness with safe fallback
  const publishCheck = checkPublishReadiness(form, { videoPerformers: selectedPerformerIds }) || { canPublish: false, errors: [], warnings: [] };
  
  // Validate categories with safe fallback
  const categoryValidation = validateVideoCategories(form.categories || []) || { valid: true, removed: [] };
  
  // Check URL reachability (simplified - would need actual fetch in real implementation)
  const checkUrlReachability = (url) => {
    if (!url) return 'missing';
    if (!url.startsWith('http')) return 'invalid';
    return 'pending'; // Would need async fetch to determine
  };

  // Build detailed checklist
  const checks = [
    {
      id: 'video_id',
      label: 'Video ID',
      pass: !!video?.id,
      value: video?.id || 'N/A',
    },
    {
      id: 'status_current',
      label: 'Current Status',
      pass: true,
      value: form.status || 'not_set',
    },
    {
      id: 'title',
      label: 'Title Present',
      pass: form.title && form.title.trim().length >= 3,
      value: form.title ? `✓ (${(form.title || '').length} chars)` : '✗ Missing',
    },
    {
      id: 'description',
      label: 'Description Present',
      pass: !!form.description,
      value: form.description ? `✓ (${(form.description || '').length} chars)` : '✗ Missing',
    },
    {
      id: 'brand',
      label: 'Brand Assigned',
      pass: !!form.brand_id,
      value: form.brand_id ? '✓' : '✗ None',
    },
    {
      id: 'access_tier',
      label: 'Access Tier',
      pass: form.access_tier && ['free', 'fanclub', 'ppv'].includes(form.access_tier),
      value: form.access_tier || '✗ Missing',
    },
    {
      id: 'categories_valid',
      label: 'Categories Valid',
      pass: (categoryValidation?.valid !== false) && form.categories && form.categories.length > 0,
      value: (categoryValidation?.valid !== false) 
        ? `✓ ${form.categories?.length || 0} categories` 
        : `✗ Invalid: ${(categoryValidation?.removed || []).map(r => r.value).join(', ') || 'none'}`,
    },
    {
      id: 'tags',
      label: 'Tags Present',
      pass: form.tags && form.tags.length > 0,
      value: form.tags?.length > 0 ? `✓ ${form.tags.length} tags` : '⚠ None (optional)',
    },
    {
      id: 'source_video_url',
      label: 'Source Video URL',
      pass: !!form.source_video_url,
      value: form.source_video_url 
        ? `✓ Present` 
        : '✗ Missing',
      url: form.source_video_url,
    },
    {
      id: 'source_video_reachable',
      label: 'Source Video Reachable',
      pass: checkUrlReachability(form.source_video_url) === 'pending',
      value: checkUrlReachability(form.source_video_url),
      note: 'Would need async fetch to verify',
    },
    {
      id: 'asset_id',
      label: 'VideoAsset (source)',
      pass: true, // VideoAsset is optional if canonical URL exists
      value: (sourceAssets || []).length > 0 ? `✓ ${(sourceAssets || []).length} asset(s)` : '⚠ No VideoAsset (using canonical URL)',
      note: 'VideoAsset is optional - canonical URL takes precedence',
    },
    {
      id: 'thumbnail',
      label: 'Thumbnail URL',
      pass: !!form.primary_thumbnail_url,
      value: form.primary_thumbnail_url ? '✓ Present' : '✗ Missing',
      url: form.primary_thumbnail_url,
    },
    {
      id: 'thumbnail_renderable',
      label: 'Thumbnail Renderable',
      pass: checkUrlReachability(form.primary_thumbnail_url) === 'pending',
      value: checkUrlReachability(form.primary_thumbnail_url),
      note: 'Would need img load test to verify',
    },
    {
      id: 'trailer',
      label: 'Trailer/Preview URL',
      pass: !!form.trailer_url || !!form.source_video_url,
      value: form.trailer_url 
        ? '✓ Trailer URL' 
        : form.source_video_url 
          ? '✓ Using source as fallback' 
          : '✗ Missing',
      url: form.trailer_url || form.source_video_url,
    },
    {
      id: 'trailer_renderable',
      label: 'Trailer Renderable',
      pass: checkUrlReachability(form.trailer_url || form.source_video_url) === 'pending',
      value: checkUrlReachability(form.trailer_url || form.source_video_url),
      note: 'Would need video load test to verify',
    },
    {
      id: 'seo_title',
      label: 'SEO Meta Title',
      pass: !!form.meta_title,
      value: form.meta_title ? '✓ Present' : '⚠ Missing (warning)',
    },
    {
      id: 'seo_description',
      label: 'SEO Meta Description',
      pass: !!form.meta_description,
      value: form.meta_description ? '✓ Present' : '⚠ Missing (warning)',
    },
    {
      id: 'performers',
      label: 'Performer(s) Assigned',
      pass: (selectedPerformerIds || []).length > 0,
      value: (selectedPerformerIds || []).length > 0 
        ? `✓ ${(selectedPerformerIds || []).length} performer(s)` 
        : '✗ None assigned',
    },
  ];

  const blockingIssues = checks.filter(c => !c.pass && c.id !== 'seo_title' && c.id !== 'seo_description');
  const warnings = checks.filter(c => !c.pass && (c.id === 'seo_title' || c.id === 'seo_description'));

  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">🔍 Publishing Debug Panel</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          className="gap-1 text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-3">
        <Badge className={publishCheck.canPublish ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
          {publishCheck.canPublish ? (
            <><CheckCircle2 className="w-3 h-3 mr-1" /> Ready to Publish</>
          ) : (
            <><XCircle className="w-3 h-3 mr-1" /> Cannot Publish</>
          )}
        </Badge>
        <Badge variant="outline">
          {blockingIssues.length} blocking issue(s)
        </Badge>
        <Badge variant="outline">
          {warnings.length} warning(s)
        </Badge>
      </div>

      {/* Blocking Issues */}
      {blockingIssues.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs space-y-1">
          <p className="font-semibold text-red-500">❌ Blocking Issues:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {blockingIssues.map(check => (
              <li key={check.id} className="text-red-400">
                <span className="font-medium">{check.label}:</span> {check.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs space-y-1">
          <p className="font-semibold text-yellow-600">⚠️ Warnings (non-blocking):</p>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map(check => (
              <li key={check.id} className="text-yellow-600">
                <span className="font-medium">{check.label}:</span> {check.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Checklist */}
      <div className="grid md:grid-cols-2 gap-2 text-xs">
        {checks.map(check => (
          <div 
            key={check.id}
            className={`flex items-start justify-between p-2 rounded border ${
              check.pass 
                ? 'bg-green-500/5 border-green-500/20' 
                : check.id === 'seo_title' || check.id === 'seo_description'
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              {check.pass ? (
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
              )}
              <span className="font-medium">{check.label}</span>
            </div>
            <div className="text-right max-w-[200px] break-all">
              <span className={check.pass ? 'text-green-600' : 'text-red-500'}>
                {check.value}
              </span>
              {check.note && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{check.note}</p>
              )}
              {check.url && (
                <a 
                  href={check.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline block mt-0.5"
                >
                  Open URL ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Publish Errors from Guardrails */}
      {(publishCheck.errors || []).length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs">
          <p className="font-semibold text-destructive mb-1">❌ Publish Guardrail Errors:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {(publishCheck.errors || []).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Final Status */}
      <div className="border-t border-border pt-3 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Final canPublish:</span>
          <Badge className={publishCheck.canPublish ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
            {publishCheck.canPublish ? 'true' : 'false'}
          </Badge>
        </div>
        {!publishCheck.canPublish && (
          <div className="mt-2 text-[10px] text-muted-foreground">
            <p>Exact blocking reasons:</p>
            <ul className="list-disc list-inside mt-1">
              {(publishCheck.errors || []).map((err, i) => (
                <li key={i} className="text-destructive">{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}