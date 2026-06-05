import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { checkPublishReadiness } from "@/lib/publishReadinessGuardrails";
import { validateVideoCategories } from "@/lib/videoTaxonomy";

/**
 * Publishing Readiness Checklist
 * Shows each required item with pass/fail status before Save/Publish buttons
 */
export default function PublishReadinessChecklist({ 
  video, 
  form, 
  selectedPerformerIds = [],
  onCleanInvalidCategories,
  assetValidation = {}
}) {
  // Calculate publish readiness
  const publishCheck = checkPublishReadiness(form, { 
    videoPerformers: selectedPerformerIds 
  });

  // Validate categories
  const categoryValidation = validateVideoCategories(form.categories || []);
  const hasInvalidCategories = !categoryValidation.valid || (categoryValidation.removed || []).length > 0;

  // Build checklist items with asset validation
  const checklistItems = [
    {
      id: 'title',
      label: 'Title',
      pass: form.title && form.title.trim().length >= 3,
      critical: true,
    },
    {
      id: 'description',
      label: 'Description',
      pass: form.description && form.description.trim().length >= 50,
      critical: false,
    },
    {
      id: 'brand',
      label: 'Brand',
      pass: !!form.brand_id,
      critical: false,
    },
    {
      id: 'access_tier',
      label: 'Access Tier',
      pass: form.access_tier && ['free', 'fanclub', 'ppv'].includes(form.access_tier),
      critical: true,
    },
    {
      id: 'categories',
      label: 'Categories',
      pass: form.categories && form.categories.length > 0 && categoryValidation.valid,
      critical: false,
      hasError: hasInvalidCategories,
    },
    {
      id: 'tags',
      label: 'Tags',
      pass: form.tags && form.tags.length > 0,
      critical: false,
    },
    {
      id: 'source_video',
      label: 'Source Video',
      pass: !!form.source_video_url && assetValidation.source?.httpStatus === 200,
      critical: true,
      details: assetValidation.source?.httpStatus ? `HTTP ${assetValidation.source.httpStatus}` : null,
    },
    {
      id: 'thumbnail',
      label: 'Thumbnail',
      pass: !!form.primary_thumbnail_url && assetValidation.thumbnail?.httpStatus === 200,
      critical: true,
      details: assetValidation.thumbnail?.httpStatus ? `HTTP ${assetValidation.thumbnail.httpStatus}` : null,
    },
    {
      id: 'trailer',
      label: 'Trailer/Preview',
      pass: (!!form.trailer_url || !!form.source_video_url) && assetValidation.preview?.httpStatus === 200,
      critical: true,
      details: assetValidation.preview?.httpStatus ? `HTTP ${assetValidation.preview.httpStatus}` : null,
    },
    {
      id: 'seo_title',
      label: 'SEO Meta Title',
      pass: !!form.meta_title,
      critical: false,
    },
    {
      id: 'seo_description',
      label: 'SEO Meta Description',
      pass: !!form.meta_description,
      critical: false,
    },
    {
      id: 'performers',
      label: 'Performer(s)',
      pass: (selectedPerformerIds || []).length > 0,
      critical: true,
    },
    {
      id: 'status',
      label: 'Status',
      pass: form.status && ['draft', 'published', 'unlisted', 'archived'].includes(form.status),
      critical: true,
    },
  ];

  const criticalFailures = checklistItems.filter(item => item.critical && !item.pass);
  const warnings = checklistItems.filter(item => !item.critical && !item.pass);

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">📋 Publishing Checklist</h2>
        {publishCheck.canPublish ? (
          <Badge className="bg-green-500/10 text-green-500 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ready to Publish
          </Badge>
        ) : (
          <Badge className="bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            {criticalFailures.length} Critical Issue(s)
          </Badge>
        )}
      </div>

      {/* Checklist Grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {checklistItems.map(item => (
          <div 
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              item.pass 
                ? 'bg-green-500/5 border-green-500/20' 
                : item.critical 
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-yellow-500/5 border-yellow-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {item.pass ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : item.critical ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className={`text-sm ${
                item.pass ? 'text-green-600' : item.critical ? 'text-red-500' : 'text-yellow-600'
              }`}>
                {item.label}
                {item.details && <span className="ml-1 text-xs opacity-70">({item.details})</span>}
              </span>
            </div>
            {item.hasError && onCleanInvalidCategories && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCleanInvalidCategories}
                className="h-6 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clean
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Critical Failures */}
      {criticalFailures.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-500 space-y-1">
          <p className="font-semibold">⚠️ Cannot Publish - Critical Issues:</p>
          <ul className="list-disc list-inside">
            {criticalFailures.map(item => (
              <li key={item.id}>
                {item.label} 
                {item.details ? ` - ${item.details}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && criticalFailures.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-600">
          <p className="font-semibold mb-1">⚠️ Warnings ({warnings.length}):</p>
          <ul className="list-disc list-inside">
            {warnings.map(item => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Invalid Categories Alert */}
      {hasInvalidCategories && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive">
          <p className="font-semibold mb-1">❌ Invalid Categories Detected:</p>
          {(categoryValidation.removed || []).length > 0 && (
            <ul className="list-disc list-inside">
              {(categoryValidation.removed || []).map((cat, i) => (
                <li key={i}>"{cat.value}" - {cat.reason.replace(/_/g, ' ')}</li>
              ))}
            </ul>
          )}
          {onCleanInvalidCategories && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCleanInvalidCategories}
              className="mt-2 gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clean Invalid Categories
            </Button>
          )}
        </div>
      )}
    </div>
  );
}