import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
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
  onCleanInvalidCategories 
}) {
  // Calculate publish readiness
  const publishCheck = checkPublishReadiness(form, { 
    videoPerformers: selectedPerformerIds 
  });

  // Validate categories
  const categoryValidation = validateVideoCategories(form.categories || []);
  const hasInvalidCategories = !categoryValidation.valid || (categoryValidation.removed && categoryValidation.removed.length > 0);

  // Build checklist items
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
      pass: !!form.source_video_url,
      critical: true,
    },
    {
      id: 'thumbnail',
      label: 'Thumbnail',
      pass: !!form.primary_thumbnail_url,
      critical: true,
    },
    {
      id: 'trailer',
      label: 'Trailer/Preview',
      pass: !!form.trailer_url || !!form.source_video_url,
      critical: true,
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
      pass: selectedPerformerIds.length > 0,
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
    <section className="bg-card border border-border rounded-xl p-6 space-y-4">
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
              </span>
            </div>
            {item.hasError && (
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

      {/* Summary */}
      {criticalFailures.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-500 space-y-1">
          <p className="font-semibold">⚠️ Cannot Publish - Critical Issues:</p>
          <ul className="list-disc list-inside">
            {criticalFailures.map(item => (
              <li key={item.id}>{item.label} {item.id === 'source_video' || item.id === 'thumbnail' ? '(missing)' : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-600">
          <p className="font-semibold">⚠️ Warnings (can publish but recommended to fix):</p>
          <ul className="list-disc list-inside">
            {warnings.map(item => (
              <li key={item.id}>{item.label} {item.id === 'description' ? '(too short)' : item.id === 'tags' ? '(missing)' : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Invalid Categories Alert */}
      {hasInvalidCategories && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive">
          <p className="font-semibold mb-1">❌ Invalid Categories Detected:</p>
          {categoryValidation.removed && categoryValidation.removed.length > 0 && (
            <ul className="list-disc list-inside">
              {categoryValidation.removed.map((cat, i) => (
                <li key={i}>"{cat.value}" - {cat.reason.replace(/_/g, ' ')}</li>
              ))}
            </ul>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onCleanInvalidCategories}
            className="mt-2 gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clean Invalid Categories
          </Button>
        </div>
      )}
    </section>
  );
}