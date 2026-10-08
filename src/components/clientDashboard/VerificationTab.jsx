import { Shield, Check, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatusDot({ status }) {
  const map = {
    verified:     "bg-emerald-500",
    uploaded:     "bg-amber-500",
    complete:     "bg-emerald-500",
    partial:      "bg-amber-500",
    required:     "bg-rose-500",
    not_required: "bg-white/15",
    pending:      "bg-white/15",
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${map[status] || "bg-white/15"}`} />;
}

function VerificationRow({ label, status, note }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <StatusDot status={status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-white/70 text-sm">{label}</span>
          <span className={`text-xs font-bold ${
            status === "verified" || status === "complete" ? "text-emerald-400" :
            status === "uploaded" || status === "partial"  ? "text-amber-400" :
            status === "required"                          ? "text-rose-400" :
            "text-white/30"
          }`}>
            {status === "not_required" ? "Not required yet" :
             status === "uploaded"     ? "Uploaded — under review" :
             status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
          </span>
        </div>
        {note && <p className="text-white/25 text-xs mt-0.5 leading-relaxed">{note}</p>}
      </div>
    </div>
  );
}

export default function VerificationTab({ requests }) {
  const hasRequest = requests.length > 0;
  const latestReq = requests[0];

  const idStatus     = latestReq?.compliance_upload_status === "verified" ? "verified"
                     : latestReq?.compliance_upload_status === "uploaded"  ? "uploaded"
                     : hasRequest ? "not_required" : "not_required";

  const mediaStatus  = latestReq?.media_upload_status === "complete"  ? "complete"
                     : latestReq?.media_upload_status === "partial"   ? "partial"
                     : hasRequest ? "not_required" : "not_required";

  const consentStatus = latestReq?.confirmed_contact_consent ? "complete" : hasRequest ? "pending" : "not_required";

  return (
    <div className="space-y-5">
      <h2 className="font-black text-white text-base flex items-center gap-2">
        <Shield className="w-4 h-4 text-rose-400" />
        Verification & Media
      </h2>

      {!hasRequest ? (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-6 text-center">
          <Shield className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-white/40 text-sm leading-relaxed max-w-sm mx-auto">
            Verification is only required when submitting a Fan Production request or accessing features that require age verification.
          </p>
          <Button
            onClick={() => window.location.href = "/fan-productions/request"}
            className="mt-4 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl h-auto gap-2 text-sm"
          >
            Submit a Fan Production Request
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-5">
            <h3 className="font-bold text-white/70 text-sm mb-1">Fan Production Verification</h3>
            <p className="text-white/30 text-xs mb-4 leading-relaxed">
              FLESHLAB may request verification after your initial request is reviewed. No uploads are required until requested.
            </p>
            <VerificationRow
              label="ID verification"
              status={idStatus}
              note="Government-issued photo ID required for 18+ compliance."
            />
            <VerificationRow
              label="Media uploads"
              status={mediaStatus}
              note="Photos and optional video may be requested by FLESHLAB after review."
            />
            <VerificationRow
              label="Consent confirmations"
              status={consentStatus}
            />
          </div>

          <div className="bg-white/3 border border-white/6 rounded-xl p-4 text-white/25 text-xs leading-relaxed">
            FLESHLAB will contact you via your registered contact details if media or ID uploads are required. Do not upload documents unless requested. Private media files are stored securely and not publicly accessible.
          </div>
        </>
      )}
    </div>
  );
}