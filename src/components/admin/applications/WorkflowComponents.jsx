import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export function LifecycleStep({ step, isLast }) {
  const statusColors = {
    complete: "text-green-500 border-green-500",
    pending: "text-yellow-500 border-yellow-500",
    blocked: "text-red-500 border-red-500",
    missing: "text-orange-500 border-orange-500",
  };

  const statusIcons = {
    complete: CheckCircle,
    pending: Loader2,
    blocked: XCircle,
    missing: AlertTriangle,
  };

  const Icon = statusIcons[step.status] || AlertTriangle;

  return (
    <div className="flex gap-3">
      <div className={`flex flex-col items-center ${!isLast ? 'pb-4' : ''}`}>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-background ${statusColors[step.status] || 'text-muted-foreground border-muted'}`}>
          <Icon className={`w-4 h-4 ${step.status === 'pending' ? 'animate-spin' : ''}`} />
        </div>
        {!isLast && <div className="w-px h-8 bg-muted" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{step.title}</p>
          {step.badge && <Badge variant="outline" className="text-xs">{step.badge}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
        {step.details && (
          <div className="mt-2 text-xs space-y-1">
            {step.details.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ValidationSummary({ checks, errors }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {checks.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2 text-green-500 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Passed
          </p>
          <ul className="text-xs space-y-1">
            {checks.map((check, idx) => (
              <li key={idx} className="text-muted-foreground">{check}</li>
            ))}
          </ul>
        </div>
      )}
      {errors.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2 text-red-500 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Failed
          </p>
          <ul className="text-xs space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-muted-foreground">{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ContractDetailsCard({ contract, onCopyLink, onOpenLink }) {
  if (!contract) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Status</p>
          <Badge variant="outline">{contract.status}</Badge>
        </div>
        <div>
          <p className="text-muted-foreground">Type</p>
          <p className="font-medium">{contract.contract_type}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Created</p>
          <p className="font-medium">
            {contract.created_date ? new Date(contract.created_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        {contract.signing_url && (
          <div>
            <p className="text-muted-foreground">Signing URL</p>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="outline" onClick={onCopyLink}>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={onOpenLink}>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}