import { Film, Video, Star, CreditCard, Shield, MessageCircle, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PACKAGE_LABELS, STATUS_CONFIG } from "@/components/dashboard/RequestCard";

const ACTIVE_STATUSES = new Set(["pending","media_pending","media_required","reviewing","pending_review",
  "performer_approval_pending","quote_pending","quote_issued","approved",
  "reservation_pending","reservation_paid","scheduled","confirmed"]);

function SummaryCard({ icon: Icon, label, value, valueColor = "text-white", onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#0f0f0f] border border-white/8 rounded-xl p-4 text-left transition-colors ${onClick ? "hover:border-white/15 cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-rose-400/70" />
        <span className="text-white/30 text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-black text-lg leading-tight ${valueColor}`}>{value}</div>
    </button>
  );
}

function NextStepCard({ requests, setActiveTab }) {
  const latestActive = requests.find((r) => ACTIVE_STATUSES.has(r.status));
  if (!latestActive) return null;

  const actionNeeded = ["media_pending","media_required","reservation_pending","quote_issued"].includes(latestActive.status);
  const status = STATUS_CONFIG[latestActive.status] || STATUS_CONFIG.pending;

  const messages = {
    pending: "Studio review pending — FLESHLAB will review your request within 48–72 hours.",
    media_pending: "Media upload required — FLESHLAB has requested additional photos or video.",
    media_required: "Media upload required — FLESHLAB has requested additional photos or video.",
    reviewing: "Studio review in progress — our team will contact you soon.",
    pending_review: "Studio review in progress — our team will contact you soon.",
    performer_approval_pending: "Awaiting performer approval — this may take a few days.",
    quote_pending: "Quote is being prepared for your production.",
    quote_issued: "A quote has been issued. Contact management to review and confirm.",
    approved: "Your Fan Production is approved. A 50% reservation is required to secure your date.",
    reservation_pending: "Reservation payment required — contact management to arrange payment.",
    reservation_paid: "Reservation paid — production scheduling in progress.",
    scheduled: "Production day confirmed — FLESHLAB will send final details.",
    confirmed: "Your Fan Production is confirmed.",
  };

  return (
    <div className={`rounded-xl border p-4 ${actionNeeded ? "bg-rose-950/25 border-rose-700/30" : "bg-white/3 border-white/8"}`}>
      <div className={`text-xs font-black uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${actionNeeded ? "text-rose-400" : "text-white/35"}`}>
        {actionNeeded ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        Action required — Fan Production
      </div>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold mb-2 ${status.bg} ${status.color}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        {status.label}
      </div>
      <p className="text-white/55 text-sm leading-relaxed">
        {messages[latestActive.status] || messages.pending}
      </p>
      <button
        onClick={() => setActiveTab("fan-productions")}
        className="mt-3 text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors"
      >
        View request details <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function OverviewTab({ requests, subscriptions, payments, user, loading, setActiveTab }) {
  const activeRequests = requests.filter((r) => ACTIVE_STATUSES.has(r.status)).length;
  const activeSubs = subscriptions.filter((s) => s.status === "active").length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const verificationLabel = (() => {
    const statuses = requests.map((r) => r.compliance_upload_status);
    if (statuses.includes("verified")) return "Verified";
    if (statuses.includes("uploaded")) return "Under review";
    if (requests.some((r) => ["media_required","media_pending"].includes(r.status))) return "Required";
    return "Not required yet";
  })();

  const latestRequest = requests[0];

  const WA_LINK = `https://wa.me/886958679186?text=${encodeURIComponent("Hi FLESHLAB Management, I need help with my account or Fan Production request.")}`;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryCard icon={Film} label="Fan Productions" value={loading ? "—" : activeRequests.toString()} valueColor={activeRequests > 0 ? "text-rose-400" : "text-white/35"} onClick={() => setActiveTab("fan-productions")} />
        <SummaryCard icon={Star} label="Fanclub" value={loading ? "—" : activeSubs > 0 ? "Active" : "None"} valueColor={activeSubs > 0 ? "text-emerald-400" : "text-white/35"} onClick={() => setActiveTab("fanclub")} />
        <SummaryCard icon={Shield} label="Verification" value={loading ? "—" : verificationLabel} valueColor={verificationLabel === "Verified" ? "text-emerald-400" : verificationLabel === "Required" ? "text-amber-400" : "text-white/35"} onClick={() => setActiveTab("verification")} />
        <SummaryCard icon={CreditCard} label="Payments" value={loading ? "—" : payments.length > 0 ? `${payments.length} records` : "None"} valueColor="text-white/60" onClick={() => setActiveTab("payments")} />
        <SummaryCard icon={Video} label="My Videos" value="Coming soon" valueColor="text-white/25" onClick={() => setActiveTab("videos")} />
        <SummaryCard icon={MessageCircle} label="Messages" value="0 new" valueColor="text-white/35" onClick={() => setActiveTab("messages")} />
      </div>

      {/* Next step */}
      {!loading && <NextStepCard requests={requests} setActiveTab={setActiveTab} />}

      {/* Latest Fan Production */}
      {latestRequest && (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Film className="w-4 h-4 text-rose-400" />
              Latest Fan Production Request
            </h3>
            <button onClick={() => setActiveTab("fan-productions")} className="text-xs text-rose-400/70 hover:text-rose-400 flex items-center gap-1 font-bold transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="text-white/70 text-sm font-semibold mb-1">
            {PACKAGE_LABELS[latestRequest.production_package] || latestRequest.package_interest || "Fan Production Request"}
          </div>
          {latestRequest.preferred_performer && (
            <div className="text-white/40 text-xs mb-2">Performer: {latestRequest.preferred_performer}</div>
          )}
          {(() => {
            const s = STATUS_CONFIG[latestRequest.status] || STATUS_CONFIG.pending;
            return (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${s.bg} ${s.color}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                {s.label}
              </div>
            );
          })()}
        </div>
      )}

      {/* Empty state CTAs */}
      {!loading && requests.length === 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-5">
            <Film className="w-6 h-6 text-rose-400/60 mb-3" />
            <h4 className="font-black text-white text-sm mb-1">Fan Productions</h4>
            <p className="text-white/35 text-xs mb-4 leading-relaxed">Become part of an official FLESHLAB homemade-style production with a verified performer.</p>
            <Button size="sm" onClick={() => window.location.href = "/fan-productions/request"} className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg h-8 px-4">
              Build a Request
            </Button>
          </div>
          <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-5">
            <Star className="w-6 h-6 text-rose-400/60 mb-3" />
            <h4 className="font-black text-white text-sm mb-1">Fanclub</h4>
            <p className="text-white/35 text-xs mb-4 leading-relaxed">Get unlimited access to exclusive performer content with a Fanclub membership.</p>
            <Button size="sm" onClick={() => window.location.href = "/fanclub"} variant="outline" className="border-white/15 text-white/60 hover:bg-white/8 text-xs h-8 px-4">
              Join Fanclub
            </Button>
          </div>
        </div>
      )}

      {/* Support */}
      <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-5">
        <h3 className="font-black text-white text-sm mb-1.5 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-rose-400" />
          Need help?
        </h3>
        <p className="text-white/40 text-xs mb-3 leading-relaxed">Contact FLESHLAB Management for any questions about your account, requests or purchases.</p>
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="border-white/12 text-white/60 hover:bg-white/8 hover:text-white gap-2 text-xs h-8">
            <MessageCircle className="w-3.5 h-3.5" />
            Contact Management on WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}