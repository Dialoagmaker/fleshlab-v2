import React from "react";
import { getAssetHealthStatus, classifyAssetUrl } from "@/lib/videoAssetResolver";
import { CheckCircle2, AlertCircle, Loader2, XCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AssetHealthBadge — Shows asset validation status
 * 
 * Status values:
 * - healthy_canonical: All assets valid, using canonical CDN URLs
 * - healthy_legacy: All assets valid, using legacy R2.dev URLs
 * - missing: One or more assets missing (no URL)
 * - corrupt: Asset contains invalid data (HTML saved as JPG)
 * - validation_required: Asset URLs present but not yet validated server-side
 * - render_failed: Browser render test failed (img/video onError)
 * 
 * @param {Object} video - Video entity
 * @param {Object} validation - Optional server validation results
 * @param {boolean} showDetails - Show detailed breakdown (admin-only)
 * @param {string} size - Badge size: 'sm' | 'md' | 'lg'
 */
export default function AssetHealthBadge({ 
  video, 
  validation = null, 
  showDetails = false,
  size = 'md' 
}) {
  const health = getAssetHealthStatus(video, validation);

  const config = {
    healthy_canonical: {
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-500/10 border-green-500/20',
      label: 'Healthy (Canonical)',
      title: 'All assets valid using canonical CDN URLs'
    },
    healthy_legacy: {
      icon: CheckCircle2,
      color: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
      label: 'Healthy (Legacy)',
      title: 'All assets valid using legacy R2 URLs - migration recommended'
    },
    missing: {
      icon: AlertCircle,
      color: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
      label: 'Missing Assets',
      title: 'One or more assets missing'
    },
    corrupt: {
      icon: XCircle,
      color: 'text-destructive bg-destructive/10 border-destructive/20',
      label: 'Corrupt Asset',
      title: 'Asset contains invalid data (e.g. HTML saved as JPG)'
    },
    validation_required: {
      icon: ShieldAlert,
      color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
      label: 'Validation Required',
      title: 'Asset URLs present but not yet validated'
    },
    render_failed: {
      icon: XCircle,
      color: 'text-destructive bg-destructive/10 border-destructive/20',
      label: 'Render Failed',
      title: 'Browser could not render asset'
    }
  };

  const currentConfig = config[health.status] || config.validation_required;
  const Icon = currentConfig.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <div className="inline-flex items-center gap-1.5" title={currentConfig.title}>
      <span className={cn(
        'rounded-full border font-medium inline-flex items-center gap-1.5',
        currentConfig.color,
        sizeClasses[size]
      )}>
        <Icon className={cn(
          "w-3 h-3",
          size === 'lg' ? 'w-4 h-4' : ''
        )} />
        {currentConfig.label}
      </span>

      {/* Detailed breakdown (admin-only) */}
      {showDetails && health.details && (
        <div className="ml-2 text-[10px] text-muted-foreground space-y-0.5">
          {health.details.thumbnailType && (
            <div>Thumbnail: {health.details.thumbnailType}</div>
          )}
          {health.details.sourceType && (
            <div>Source: {health.details.sourceType}</div>
          )}
          {health.details.missingThumbnail && (
            <div className="text-destructive">Missing: Thumbnail</div>
          )}
          {health.details.missingSource && (
            <div className="text-destructive">Missing: Source</div>
          )}
          {validation?.thumbnail?.corrupt && (
            <div className="text-destructive">Corrupt: {validation.thumbnail.reason}</div>
          )}
        </div>
      )}
    </div>
  );
}