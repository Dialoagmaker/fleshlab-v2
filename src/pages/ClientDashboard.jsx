import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Clock, CheckCircle, AlertCircle, ChevronRight, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";

const PACKAGE_LABELS = {
  short_799: "Short Fan Production — $799",
  full_1499: "Full Fan Production — $1,499",
  premium_2499: "Premium Fan Production — $2,499",
  custom_quote: "Custom / Multi-scene — Quote on request",
};

const STATUS_CONFIG = {
  pending: { label: "Submitted", color: "text-blue-400", bg: "bg-blue-600/15 border-blue-600/25", icon: Clock },
  media_pending: { label: "Under Review", color: "text-amber-400", bg: "bg-amber-600/15 border-amber-600/25", icon: Clock },
  reviewing: { label: "Under Review", color: "text-amber-400", bg: "bg-amber-600/15 border-amber-600/25", icon: Clock },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-600/15 border-emerald-600/25", icon: CheckCircle },
  rejected: { label: "Not Approved", color: "text-red-400", bg: "bg-red-600/15 border-red-600/25", icon: AlertCircle },
};

const NEXT_STEPS = {
  pending: "Your request has been received. Our team will review it within 48–72 hours and contact you via the details you provided.",
  media_pending: "We are reviewing your request. You may be contacted for additional information.",
  reviewing: "Your request is under active review. Our team will contact you soon.",
  approved: "Congratulations — your request has been approved. Our team will contact you to discuss the next steps.",
  rejected: "Your request was not approved at this time. Please contact us if you have questions.",
};

export default function ClientDashboard() {
  const { isAuthenticated, user, isLoadingAuth, authChecked } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    if (!isAuthenticated) {
      navigate("/register?next=/client/dashboard");
      return;
    }
    loadRequests();
  }, [authChecked, isLoadingAuth, isAuthenticated]);

  const loadRequests = async () => {
    try {
      const all = await base44.entities.GuestProductionApplication.filter({
        request_type: "fan_production",
      });
      // Filter to current user's requests
      const mine = all.filter(
        (r) => r.applicant_user_id === user?.id || r.email === user?.email
      );
      // Sort newest first
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

  return (
    <>
      <SEOMeta title="My Dashboard | FLESHLAB" noIndex={true} />
      <div className="min-h-screen bg-[#080808] text-white">
        {/* Header */}
        <div className="border-b border-white/6 bg-[#0a0a0a]">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/30 flex items-center justify-center">
                <User className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">FLESHLAB Account</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">My Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}. Track your Fan Production requests and account status here.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          {/* Fan Production Requests */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-rose-400" />
                Fan Production Requests
              </h2>
              {requests.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => navigate("/fan-productions/request")}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg h-8 px-4"
                >
                  New Request
                </Button>
              )}
            </div>

            {loading ? (
              <div className="bg-[#111] border border-white/8 rounded-xl p-8 text-center">
                <div className="w-6 h-6 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin mx-auto" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-[#111] border border-white/8 rounded-xl p-8 text-center">
                <Film className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <h3 className="text-white/60 font-semibold mb-1">No requests yet</h3>
                <p className="text-white/30 text-sm mb-5">
                  Submit your first Fan Production request and our team will review it within 48–72 hours.
                </p>
                <Button
                  onClick={() => navigate("/fan-productions/request")}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 py-2.5 rounded-xl h-auto"
                >
                  Build Your Fan Production Request
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const StatusIcon = status.icon;
                  const nextStep = NEXT_STEPS[req.status] || NEXT_STEPS.pending;
                  const submittedDate = req.submitted_at
                    ? new Date(req.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                    : "—";

                  return (
                    <div key={req.id} className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <div className="text-xs text-white/30 mb-0.5">Submitted {submittedDate}</div>
                            <h3 className="font-bold text-white">
                              {PACKAGE_LABELS[req.production_package] || req.package_interest || "Fan Production Request"}
                            </h3>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${status.bg} ${status.color} shrink-0`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </div>
                        </div>

                        {/* Summary rows */}
                        <div className="space-y-1.5 text-sm mb-4">
                          {req.preferred_performer && (
                            <div className="flex gap-2">
                              <span className="text-white/30 w-36 shrink-0">Preferred Performer</span>
                              <span className="text-white/70">{req.preferred_performer}</span>
                            </div>
                          )}
                          {req.production_country && (
                            <div className="flex gap-2">
                              <span className="text-white/30 w-36 shrink-0">Location</span>
                              <span className="text-white/70">{req.production_country}{req.requested_city ? `, ${req.requested_city}` : ""}</span>
                            </div>
                          )}
                          {req.privacy_option && (
                            <div className="flex gap-2">
                              <span className="text-white/30 w-36 shrink-0">Privacy</span>
                              <span className="text-white/70">{req.privacy_option}</span>
                            </div>
                          )}
                        </div>

                        {/* Next step */}
                        <div className="bg-white/4 border border-white/8 rounded-lg px-4 py-3 text-white/50 text-sm leading-relaxed">
                          <span className="text-white/30 text-xs font-bold uppercase tracking-widest block mb-1">Next Step</span>
                          {nextStep}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Contact / Support */}
          <section className="bg-[#111] border border-white/8 rounded-xl p-5">
            <h2 className="font-bold text-white mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-rose-400" />
              Need Help?
            </h2>
            <p className="text-white/45 text-sm mb-4">
              If you have questions about your request or want to update your details, contact our management team directly.
            </p>
            <a
              href="https://wa.me/message/FLESHLAB"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-white/15 text-white/70 hover:bg-white/8 hover:text-white gap-2 text-sm">
                <MessageCircle className="w-4 h-4" />
                Contact Management on WhatsApp
              </Button>
            </a>
          </section>

        </div>
      </div>
    </>
  );
}