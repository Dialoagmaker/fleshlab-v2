import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Film, Plus, User, MessageCircle, ChevronRight,
  Shield, Clock, FileCheck, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import RequestCard, { STATUS_CONFIG } from "@/components/dashboard/RequestCard";

const WA_LINK = `https://wa.me/886958679186?text=${encodeURIComponent("Hi FLESHLAB Management, I need help with my Fan Production request.")}`;

const ACTIVE_STATUSES = new Set(["pending", "media_pending", "media_required", "reviewing", "pending_review",
  "performer_approval_pending", "quote_pending", "quote_issued", "approved",
  "reservation_pending", "reservation_paid", "scheduled", "confirmed"]);

function getVerificationLabel(requests) {
  const statuses = requests.map((r) => r.compliance_upload_status);
  if (statuses.includes("verified")) return "Verified";
  if (statuses.includes("uploaded")) return "Under review";
  if (requests.some((r) => r.status === "media_required" || r.status === "media_pending")) return "Required";
  return "Not required yet";
}

function getVerificationColor(label) {
  if (label === "Verified") return "text-emerald-400";
  if (label === "Required") return "text-amber-400";
  if (label === "Under review") return "text-blue-400";
  return "text-white/35";
}

function SummaryCard({ icon: Icon, label, value, valueColor = "text-white" }) {
  return (
    <div className="bg-[#0f0f0f] border border-white/8 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-rose-400/70" />
        <span className="text-white/30 text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-black text-lg leading-tight ${valueColor}`}>{value}</div>
    </div>
  );
}

export default function ClientDashboard() {
  const { isAuthenticated, user, isLoadingAuth, authChecked } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    if (!isAuthenticated) {
      window.location.href = "/login?next=" + encodeURIComponent("/client/dashboard");
      return;
    }
    loadRequests();
  }, [authChecked, isLoadingAuth, isAuthenticated]);

  const loadRequests = async () => {
    try {
      const all = await base44.entities.GuestProductionApplication.filter({
        request_type: "fan_production",
      });
      const mine = all.filter(
        (r) => r.applicant_user_id === user?.id || r.email === user?.email
      );
      mine.sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date));
      setRequests(mine);
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeCount = requests.filter((r) => ACTIVE_STATUSES.has(r.status)).length;
  const verificationLabel = getVerificationLabel(requests);
  const hasQuote = requests.some((r) =>
    ["quote_issued", "approved", "reservation_pending", "reservation_paid", "scheduled", "confirmed"].includes(r.status)
  );
  const hasReservation = requests.some((r) =>
    ["reservation_paid", "scheduled", "confirmed"].includes(r.status)
  );

  const displayName = user?.full_name && user.full_name !== user.email ? user.full_name : null;

  return (
    <>
      <SEOMeta title="Client Dashboard | FLESHLAB" noIndex={true} />
      <div className="min-h-screen bg-[#080808] text-white">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="border-b border-white/6 bg-[#0a0505]">
          <div className="max-w-5xl mx-auto px-4 py-7">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-600/20 border border-rose-600/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <span className="text-rose-400 text-xs font-black uppercase tracking-widest">FLESHLAB Account</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">Client Dashboard</h1>
                <p className="text-white/35 text-sm mt-1.5">
                  {displayName ? `Welcome back, ${displayName}. ` : "Welcome back. "}
                  Track your Fan Production requests, verification status and next steps.
                </p>
              </div>
              <div className="shrink-0">
                <Button
                  onClick={() => navigate("/fan-productions/request")}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold gap-2 rounded-xl h-auto py-2.5 px-5 text-sm shadow-lg shadow-rose-700/25"
                >
                  <Plus className="w-4 h-4" />
                  New Fan Production Request
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

          {/* ── SUMMARY CARDS ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              icon={Film}
              label="Active Requests"
              value={loading ? "—" : activeCount.toString()}
              valueColor={activeCount > 0 ? "text-rose-400" : "text-white/35"}
            />
            <SummaryCard
              icon={Shield}
              label="Verification"
              value={loading ? "—" : verificationLabel}
              valueColor={getVerificationColor(verificationLabel)}
            />
            <SummaryCard
              icon={FileCheck}
              label="Quote Status"
              value={loading ? "—" : hasQuote ? "Issued" : "Not issued yet"}
              valueColor={hasQuote ? "text-cyan-400" : "text-white/35"}
            />
            <SummaryCard
              icon={Wallet}
              label="Reservation"
              value={loading ? "—" : hasReservation ? "Paid" : "Not required yet"}
              valueColor={hasReservation ? "text-emerald-400" : "text-white/35"}
            />
          </div>

          {/* ── MAIN CONTENT ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: requests list */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-400" />
                  Fan Production Requests
                </h2>
                <span className="text-white/25 text-xs">{requests.length} total</span>
              </div>

              {loading ? (
                <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
                  <div className="w-6 h-6 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin mx-auto" />
                </div>
              ) : requests.length === 0 ? (
                <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center mx-auto mb-4">
                    <Film className="w-7 h-7 text-rose-400/50" />
                  </div>
                  <h3 className="text-white font-black text-lg mb-2">No Fan Production requests yet</h3>
                  <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                    Ready to become part of an official FLESHLAB homemade-style production?
                  </p>
                  <Button
                    onClick={() => navigate("/fan-productions/request")}
                    className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 py-3 rounded-xl h-auto gap-2"
                  >
                    Build Your Fan Production Request
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {requests.map((req) => (
                    <RequestCard key={req.id} req={req} />
                  ))}
                </div>
              )}
            </div>

            {/* Right: sidebar */}
            <div className="space-y-4">

              {/* Account Details */}
              <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-5">
                <h3 className="text-white font-black text-sm mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-400" />
                  Account Details
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white/25 text-xs uppercase tracking-wider">Name</span>
                    <span className="text-white/70">{user?.full_name || "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white/25 text-xs uppercase tracking-wider">Email</span>
                    <span className="text-white/70 break-all">{user?.email || "—"}</span>
                  </div>
                  {requests[0]?.phone && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/25 text-xs uppercase tracking-wider">WhatsApp / Contact</span>
                      <span className="text-white/70">{requests[0].phone}</span>
                    </div>
                  )}
                  {requests[0]?.nationality && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/25 text-xs uppercase tracking-wider">Country</span>
                      <span className="text-white/70">{requests[0].nationality}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white/25 text-xs uppercase tracking-wider">Account type</span>
                    <span className="text-white/50">Fan / Customer</span>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-5">
                <h3 className="text-white font-black text-sm mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-rose-400" />
                  Need help with your request?
                </h3>
                <p className="text-white/40 text-xs mb-4 leading-relaxed">
                  Contact FLESHLAB Management if you need to update your city, performer preference, privacy option or travel availability.
                </p>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-white/12 text-white/65 hover:bg-white/8 hover:text-white gap-2 text-xs h-9"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Contact Management on WhatsApp
                  </Button>
                </a>
              </div>

              {/* Studio notice */}
              <div className="bg-rose-950/20 border border-rose-900/25 rounded-2xl p-4">
                <div className="text-rose-400/70 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Review timeline
                </div>
                <p className="text-white/35 text-xs leading-relaxed">
                  Studio reviews take 48–72 hours. Performer approval may take longer depending on availability.
                  No payment is required until a quote is issued and approved.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}