import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Film, Video, Star, CreditCard, Shield, MessageCircle, ChevronRight, Clock, AlertCircle, Play, Users, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { trackDashboardCtaClick, trackDashboardViewed } from "@/lib/analytics";
import { PACKAGE_LABELS, STATUS_CONFIG } from "@/components/dashboard/RequestCard";
import NonSubscriberCta from "@/components/cta/NonSubscriberCta";
import FanclubBenefits from "@/components/cta/FanclubBenefits";

const ACTIVE_STATUSES = new Set(["pending","media_pending","media_required","reviewing","pending_review",
  "performer_approval_pending","quote_pending","quote_issued","approved",
  "reservation_pending","reservation_paid","scheduled","confirmed"]);

function SummaryCard({ icon: Icon, label, value, valueColor = "text-white", onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`border p-4 text-left transition-colors ${active ? "border-rose-600/40" : "border-white/12 hover:border-white/25"} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-rose-400/70" />
        <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-black text-3xl leading-tight ${valueColor}`}>{value}</div>
      <div className="h-1 bg-white/8 mt-3">
        <div className="h-full bg-rose-600" style={{ width: active ? "70%" : "20%" }} />
      </div>
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
  };

  return (
    <div className={`rounded-xl border p-4 ${actionNeeded ? "bg-rose-950/25 border-rose-700/30" : "bg-white/3 border-white/8"}`}>
      <div className="text-xs font-black uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-white/35">Fan Production Status</div>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold mb-2 ${status.bg} ${status.color}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        {status.label}
      </div>
      <p className="text-white/55 text-sm leading-relaxed">
        {messages[latestActive.status] || messages.pending}
      </p>
      <button onClick={() => setActiveTab("fan-productions")} className="mt-3 text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors">
        View details <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Dynamic Content Sections ──

function FeaturedPerformerSection() {
  const [performer, setPerformer] = useState(null);

  useEffect(() => {
    base44.entities.Performer.filter({ featured: true, status: "active" }, '-created_date', 1)
      .then(p => { if (p.length > 0) setPerformer(p[0]); });
  }, []);

  if (!performer) return null;

  return (
    <div className="bg-[#0f0f0f] border border-white/8 rounded-xl overflow-hidden group cursor-pointer" onClick={() => window.location.href = `/performers/${performer.slug}`}>
      {performer.cover_image_url && (
        <div className="h-40 relative overflow-hidden">
          <img src={performer.cover_image_url} alt={performer.display_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-white/30 text-xs font-bold uppercase tracking-wider">Featured Performer</span>
        </div>
        <h4 className="text-white font-bold text-sm">{performer.display_name}</h4>
        {performer.bio && <p className="text-white/40 text-xs mt-1 line-clamp-2">{performer.bio}</p>}
      </div>
    </div>
  );
}

function LatestVideosSection() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    base44.entities.Video.filter({ status: "published" }, '-published_at', 4)
      .then(v => setVideos(v || []));
  }, []);

  if (videos.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Play className="w-4 h-4 text-rose-400" />
          Latest Videos
        </h3>
        <Link to="/videos" className="text-xs text-rose-400/70 hover:text-rose-400 font-bold transition-colors">View all →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {videos.map(v => (
          <Link key={v.id} to={`/videos/${v.slug}`} className="group block bg-[#0a0a0a] border border-white/6 rounded-lg overflow-hidden hover:border-white/12 transition-all">
            <div className="aspect-video bg-[#111] relative overflow-hidden">
              {v.primary_thumbnail_url && (
                <img src={v.primary_thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white/70 text-[10px] font-mono">
                {v.duration_seconds ? `${Math.floor(v.duration_seconds / 60)}:${String(v.duration_seconds % 60).padStart(2, '0')}` : '—'}
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-white text-xs font-medium line-clamp-1 group-hover:text-rose-300 transition-colors">{v.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PopularVideosSection() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    base44.entities.Video.filter({ status: "published" }, '-view_count', 4)
      .then(v => setVideos(v || []));
  }, []);

  if (videos.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Play className="w-4 h-4 text-rose-400" />
          Popular Videos
        </h3>
        <Link to="/videos" className="text-xs text-rose-400/70 hover:text-rose-400 font-bold transition-colors">View all →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {videos.map(v => (
          <Link key={v.id} to={`/videos/${v.slug}`} className="group flex gap-3 bg-[#0a0a0a] border border-white/6 rounded-lg p-2.5 hover:border-white/12 transition-all">
            <div className="shrink-0 w-16 h-10 rounded bg-[#111] overflow-hidden relative">
              {v.primary_thumbnail_url && <img src={v.primary_thumbnail_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium line-clamp-2">{v.title}</p>
              <p className="text-white/25 text-[10px] mt-0.5">{v.view_count || 0} views</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LatestNewsSection() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    base44.entities.NewsArticle.filter({ status: "published" }, '-published_at', 3)
      .then(a => setArticles(a || []));
  }, []);

  if (articles.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-rose-400" />
          Latest News
        </h3>
        <Link to="/news" className="text-xs text-rose-400/70 hover:text-rose-400 font-bold transition-colors">View all →</Link>
      </div>
      <div className="space-y-2.5">
        {articles.map(a => (
          <Link key={a.id} to={`/news/${a.slug}`} className="block bg-[#0a0a0a] border border-white/6 rounded-lg p-3 hover:border-white/12 transition-all">
            <p className="text-white text-sm font-medium line-clamp-1">{a.title}</p>
            <p className="text-white/35 text-xs mt-0.5 line-clamp-2">{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WhyJoinFanclub() {
  const handleClick = () => {
    trackDashboardCtaClick("join_fanclub", "/fanclub");
    window.location.href = "/fanclub";
  };

  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a0a0a] border border-rose-700/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-rose-400 fill-rose-400" />
        <h3 className="text-white font-bold text-sm">Why Join Fanclub</h3>
      </div>
      <FanclubBenefits compact />
      <Button onClick={handleClick} className="mt-4 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg h-10 gap-1.5">
        <Star className="w-4 h-4 fill-white" />
        Join Fanclub — $12.99/month
      </Button>
    </div>
  );
}

// ── Main Overview Tab ──

export default function OverviewTab({ requests, subscriptions, payments, user, loading, setActiveTab }) {
  const hasActiveSub = subscriptions.some((s) => s.status === "active" && s.current_period_end && new Date(s.current_period_end) > new Date());
  const activeRequests = requests.filter((r) => ACTIVE_STATUSES.has(r.status)).length;

  // Track dashboard view
  useEffect(() => {
    trackDashboardViewed(window.location.pathname.includes("onboarding") ? "onboarding" : "direct");
  }, []);

  const WA_LINK = `https://wa.me/886958679186?text=${encodeURIComponent("Hi FLESHLAB Management, I need help with my account or Fan Production request.")}`;

  return (
    <div className="space-y-6">
      <h2 className="text-white font-black text-lg uppercase tracking-wider border-b border-white/12 pb-2">Overview</h2>

      {/* ── ABOVE THE FOLD — Primary Conversion ── */}
      
      {/* Welcome */}
      <div>
        <p className="text-white/35 text-sm">
          {user?.full_name && user.full_name !== user.email ? `Hey ${user.full_name.split(' ')[0]} — ` : ""}
          Your hub for exclusive content, fan productions, and more.
        </p>
      </div>

      {/* Persistent non-subscriber CTA — only if no active sub */}
      <NonSubscriberCta hasActiveSub={hasActiveSub} user={user} />

      {/* Primary CTA — Join Fanclub */}
      {!hasActiveSub && (
        <Link
          to="/fanclub"
          onClick={() => trackDashboardCtaClick("join_fanclub", "/fanclub")}
          className="block bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-rose-700/20 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider mb-3">
                <Star className="w-3 h-3 fill-white" />
                Primary
              </div>
              <h3 className="text-xl font-black text-white mb-1">Join Fanclub</h3>
              <p className="text-rose-200/80 text-sm">$12.99/month — Unlimited exclusive content</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      )}

      {/* Secondary CTA — Watch Videos */}
      <Link
        to="/videos"
        onClick={() => trackDashboardCtaClick("watch_videos", "/videos")}
        className="flex items-center gap-4 bg-[#0f0f0f] border border-white/8 hover:border-white/15 rounded-xl p-4 transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center">
          <Play className="w-5 h-5 text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-bold text-sm">Watch Videos</h4>
          <p className="text-white/35 text-xs">Browse our library of exclusive content</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
      </Link>

      {/* ── DYNAMIC CONTENT SECTIONS ── */}

      <FeaturedPerformerSection />
      <LatestVideosSection />
      <PopularVideosSection />
      <WhyJoinFanclub />
      <LatestNewsSection />

      {/* ── Fan Production Status (if any) ── */}
      {!loading && <NextStepCard requests={requests} setActiveTab={setActiveTab} />}

      {/* ── Summary cards (compact) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryCard icon={Film} label="Fan Productions" value={loading ? "—" : activeRequests.toString()} valueColor={activeRequests > 0 ? "text-rose-400" : "text-white/35"} onClick={() => setActiveTab("fan-productions")} active={activeRequests > 0} />
        <SummaryCard icon={Star} label="Fanclub" value={loading ? "—" : hasActiveSub ? "Active" : "None"} valueColor={hasActiveSub ? "text-emerald-400" : "text-white/35"} onClick={() => setActiveTab("fanclub")} active={hasActiveSub} />
        <SummaryCard icon={CreditCard} label="Payments" value={loading ? "—" : payments.length > 0 ? `${payments.length} records` : "None"} valueColor="text-white/60" onClick={() => setActiveTab("payments")} />
      </div>

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