import { useState } from "react";
import { ChevronDown, ChevronUp, Check, Clock, Circle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PACKAGE_LABELS = {
  short_799: "Short Fan Production — from $799",
  full_1499: "Full Fan Production — from $1,499",
  premium_2499: "Premium Fan Production — from $2,499",
  custom_quote: "Custom / Multi-scene — Quote on request",
};

export const STATUS_CONFIG = {
  pending:                    { label: "Submitted",                 color: "text-blue-400",    bg: "bg-blue-600/15 border-blue-600/25" },
  media_pending:              { label: "Media Required",            color: "text-amber-400",   bg: "bg-amber-600/15 border-amber-600/25" },
  media_required:             { label: "Media Required",            color: "text-amber-400",   bg: "bg-amber-600/15 border-amber-600/25" },
  reviewing:                  { label: "Under Review",              color: "text-purple-400",  bg: "bg-purple-600/15 border-purple-600/25" },
  pending_review:             { label: "Under Review",              color: "text-purple-400",  bg: "bg-purple-600/15 border-purple-600/25" },
  performer_approval_pending: { label: "Performer Approval Pending",color: "text-orange-400",  bg: "bg-orange-600/15 border-orange-600/25" },
  quote_pending:              { label: "Quote Pending",             color: "text-yellow-400",  bg: "bg-yellow-600/15 border-yellow-600/25" },
  quote_issued:               { label: "Quote Issued",              color: "text-cyan-400",    bg: "bg-cyan-600/15 border-cyan-600/25" },
  approved:                   { label: "Approved",                  color: "text-emerald-400", bg: "bg-emerald-600/15 border-emerald-600/25" },
  reservation_pending:        { label: "Reservation Pending",       color: "text-rose-400",    bg: "bg-rose-600/15 border-rose-600/25" },
  reservation_paid:           { label: "Reservation Paid",          color: "text-emerald-400", bg: "bg-emerald-600/15 border-emerald-600/25" },
  scheduled:                  { label: "Production Scheduled",      color: "text-emerald-400", bg: "bg-emerald-600/15 border-emerald-600/25" },
  confirmed:                  { label: "Production Confirmed",      color: "text-emerald-400", bg: "bg-emerald-600/15 border-emerald-600/25" },
  rejected:                   { label: "Rejected",                  color: "text-red-400",     bg: "bg-red-600/15 border-red-600/25" },
  cancelled:                  { label: "Cancelled",                 color: "text-white/40",    bg: "bg-white/5 border-white/10" },
};

const TIMELINE_STEPS = [
  { key: "submitted",    label: "Request submitted" },
  { key: "review",       label: "Studio review" },
  { key: "performer",    label: "Performer approval" },
  { key: "quote",        label: "Quote prepared" },
  { key: "reservation",  label: "50% reservation" },
  { key: "scheduling",   label: "Production scheduling" },
  { key: "confirmed",    label: "Production confirmed" },
];

// Map status → which timeline step is "current"
function getTimelineState(status) {
  const map = {
    pending:                    1,
    media_pending:              1,
    media_required:             1,
    reviewing:                  1,
    pending_review:             1,
    performer_approval_pending: 2,
    quote_pending:              3,
    quote_issued:               3,
    approved:                   4,
    reservation_pending:        4,
    reservation_paid:           5,
    scheduled:                  6,
    confirmed:                  7,
    rejected:                   -1,
    cancelled:                  -1,
  };
  return map[status] ?? 1;
}

const NEXT_STEP_CONFIG = {
  pending:                    { title: "Next step: Studio review", body: "Your request has been received. FLESHLAB will review your details within 48–72 hours and contact you if additional information is required." },
  media_pending:              { title: "Next step: Upload required media", body: "FLESHLAB has requested additional photos or video. Please upload the required media to continue.", cta: "Upload Media" },
  media_required:             { title: "Next step: Upload required media", body: "FLESHLAB has requested additional photos or video. Please upload the required media to continue.", cta: "Upload Media" },
  reviewing:                  { title: "Next step: Studio review in progress", body: "Your request is currently under active review. Our team will contact you soon with an update." },
  pending_review:             { title: "Next step: Studio review in progress", body: "Your request is currently under active review. Our team will contact you soon with an update." },
  performer_approval_pending: { title: "Next step: Performer approval", body: "Your request has been reviewed by the studio. We are now waiting for performer availability and approval confirmation." },
  quote_pending:              { title: "Next step: Quote preparation", body: "Your request is being reviewed for performer availability, location, travel and production scope. A quote will be prepared." },
  quote_issued:               { title: "Next step: Review your quote", body: "A quote has been prepared for your Fan Production. Please contact management to review and confirm." },
  approved:                   { title: "Next step: Reserve your production", body: "Your Fan Production has been approved. A 50% reservation payment is required to secure your date." },
  reservation_pending:        { title: "Next step: Pay 50% reservation", body: "Please contact FLESHLAB Management to arrange your reservation payment and confirm your production date.", reservationNote: true },
  reservation_paid:           { title: "Next step: Production scheduling", body: "Your reservation has been received. FLESHLAB will confirm the production date and logistics." },
  scheduled:                  { title: "Next step: Production day confirmed", body: "Your Fan Production is scheduled. FLESHLAB will contact you with final details and logistics." },
  confirmed:                  { title: "Production confirmed", body: "Your Fan Production is confirmed. FLESHLAB will contact you with final day details." },
  rejected:                   { title: "Request not approved", body: "Your request was not approved at this time. Contact FLESHLAB Management if you have questions or would like to reapply." },
  cancelled:                  { title: "Request cancelled", body: "This request has been cancelled. Submit a new Fan Production request if you would like to apply again." },
};

function cleanLocation(country, city) {
  // Strip emoji and normalize country name
  const cleanCountry = country
    ? country.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "").replace(/\s+/g, " ").trim()
    : "";
  if (city && cleanCountry) return `${city}, ${cleanCountry}`;
  return cleanCountry || city || "—";
}

export default function RequestCard({ req }) {
  const [timelineOpen, setTimelineOpen] = useState(true);
  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
  const nextStep = NEXT_STEP_CONFIG[req.status] || NEXT_STEP_CONFIG.pending;
  const timelineCurrent = getTimelineState(req.status);
  const isTerminal = req.status === "rejected" || req.status === "cancelled";

  const submittedDate = req.submitted_at
    ? new Date(req.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : req.created_date
    ? new Date(req.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const waLink = `https://wa.me/886958679186?text=${encodeURIComponent("Hi FLESHLAB Management, I need help with my Fan Production request.")}`;

  return (
    <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-white/25 mb-1 font-medium">Submitted {submittedDate}</div>
            <div className="font-black text-white text-base leading-tight">
              {PACKAGE_LABELS[req.production_package] || req.package_interest || "Fan Production Request"}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shrink-0 ${status.bg} ${status.color}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            {status.label}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm border-b border-white/6">
        {req.preferred_performer && (
          <div className="flex gap-2">
            <span className="text-white/30 shrink-0 w-32">Preferred performer</span>
            <span className="text-white/80 font-medium">{req.preferred_performer}</span>
          </div>
        )}
        {req.alternate_performer && (
          <div className="flex gap-2">
            <span className="text-white/30 shrink-0 w-32">Alternate</span>
            <span className="text-white/70">{req.alternate_performer}</span>
          </div>
        )}
        {(req.production_country || req.requested_city) && (
          <div className="flex gap-2">
            <span className="text-white/30 shrink-0 w-32">Location</span>
            <span className="text-white/80">{cleanLocation(req.production_country, req.requested_city)}</span>
          </div>
        )}
        {req.privacy_option && (
          <div className="flex gap-2">
            <span className="text-white/30 shrink-0 w-32">Privacy</span>
            <span className="text-white/80">{req.privacy_option}</span>
          </div>
        )}
        {req.expected_travel_date && (
          <div className="flex gap-2">
            <span className="text-white/30 shrink-0 w-32">Travel date</span>
            <span className="text-white/70">{req.expected_travel_date}</span>
          </div>
        )}
      </div>

      {/* Production preferences chips */}
      {req.production_preferences?.length > 0 && (
        <div className="px-5 py-3 border-b border-white/6">
          <div className="text-xs text-white/25 mb-2 font-medium uppercase tracking-wider">Production Preferences</div>
          <div className="flex flex-wrap gap-1.5">
            {req.production_preferences.map((p, i) => (
              <span key={i} className="bg-white/5 border border-white/10 text-white/55 text-xs px-2.5 py-1 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {!isTerminal && (
        <div className="px-5 py-4 border-b border-white/6">
          <button
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 font-bold uppercase tracking-wider mb-3 transition-colors"
            onClick={() => setTimelineOpen((v) => !v)}
          >
            Request Timeline
            {timelineOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {timelineOpen && (
            <div className="relative pl-5">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-white/8" />
              {TIMELINE_STEPS.map((ts, i) => {
                const stepNum = i + 1;
                const done = stepNum < timelineCurrent;
                const current = stepNum === timelineCurrent;
                const pending = stepNum > timelineCurrent;
                return (
                  <div key={ts.key} className="flex items-center gap-3 mb-2.5 last:mb-0 relative">
                    <div className={`absolute -left-5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                      done    ? "bg-emerald-600 border-emerald-500" :
                      current ? "bg-rose-600 border-rose-500 ring-2 ring-rose-600/30" :
                                "bg-[#1a1a1a] border-white/15"
                    }`}>
                      {done ? (
                        <Check className="w-2.5 h-2.5 text-white" />
                      ) : current ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      )}
                    </div>
                    <span className={`text-sm leading-tight ${
                      done    ? "text-white/45 line-through" :
                      current ? "text-white font-semibold" :
                                "text-white/25"
                    }`}>
                      {ts.label}
                    </span>
                    {current && (
                      <span className="text-[10px] bg-rose-600/20 text-rose-400 border border-rose-600/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Next step panel */}
      <div className={`px-5 py-4 border-b border-white/6 ${
        isTerminal ? "bg-white/2" : "bg-rose-950/20"
      }`}>
        <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isTerminal ? "text-white/30" : "text-rose-400/80"}`}>
          {nextStep.title}
        </div>
        <p className="text-white/50 text-sm leading-relaxed">{nextStep.body}</p>
        {nextStep.reservationNote && (
          <p className="text-white/30 text-xs mt-2">No payment is required until your request is reviewed, approved and a final quote is issued.</p>
        )}
      </div>

      {/* Quote & Reservation */}
      <div className="px-5 py-4 border-b border-white/6">
        <div className="text-xs text-white/25 font-bold uppercase tracking-wider mb-3">Quote & Reservation</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex gap-2">
            <span className="text-white/30 w-28 shrink-0">Quote status</span>
            <span className="text-white/60">
              {["quote_issued", "approved", "reservation_pending", "reservation_paid", "scheduled", "confirmed"].includes(req.status)
                ? "Quote issued" : "Not issued yet"}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-white/30 w-28 shrink-0">Reservation</span>
            <span className="text-white/60">
              {req.status === "reservation_paid" || req.status === "scheduled" || req.status === "confirmed"
                ? "Paid"
                : req.status === "reservation_pending"
                ? "Pending — contact management"
                : "Not required yet"}
            </span>
          </div>
        </div>
        {!["reservation_pending", "reservation_paid", "scheduled", "confirmed", "approved", "quote_issued"].includes(req.status) && (
          <p className="text-white/20 text-xs mt-3 leading-relaxed">
            No payment is required until your request is reviewed, approved and a final quote is issued.
          </p>
        )}
      </div>

      {/* Media/Verification */}
      <div className="px-5 py-4 border-b border-white/6">
        <div className="text-xs text-white/25 font-bold uppercase tracking-wider mb-3">Verification & Media</div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${req.compliance_upload_status === "verified" ? "bg-emerald-500" : req.compliance_upload_status === "uploaded" ? "bg-amber-500" : "bg-white/15"}`} />
            <span className="text-white/30 w-28 shrink-0">ID verification</span>
            <span className="text-white/55">
              {req.compliance_upload_status === "verified" ? "Verified"
               : req.compliance_upload_status === "uploaded" ? "Uploaded — under review"
               : "Not required yet"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${req.media_upload_status === "complete" ? "bg-emerald-500" : req.media_upload_status === "partial" ? "bg-amber-500" : "bg-white/15"}`} />
            <span className="text-white/30 w-28 shrink-0">Media</span>
            <span className="text-white/55">
              {req.media_upload_status === "complete" ? "Complete"
               : req.media_upload_status === "partial" ? "Partially uploaded"
               : "Media upload will be requested after initial review"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${req.confirmed_contact_consent ? "bg-emerald-500" : "bg-white/15"}`} />
            <span className="text-white/30 w-28 shrink-0">Consent forms</span>
            <span className="text-white/55">{req.confirmed_contact_consent ? "Complete" : "Pending"}</span>
          </div>
        </div>
      </div>

      {/* Card footer actions */}
      <div className="px-5 py-4 flex flex-wrap gap-2">
        <a href={waLink} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="border-white/12 text-white/60 hover:bg-white/8 hover:text-white gap-2 text-xs h-8">
            <MessageCircle className="w-3.5 h-3.5" />
            Contact Management
          </Button>
        </a>
      </div>
    </div>
  );
}