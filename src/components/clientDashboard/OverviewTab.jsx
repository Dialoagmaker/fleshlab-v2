import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, CalendarDays, ChevronRight, Globe2, Heart, Play, Radio, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { trackDashboardCtaClick, trackDashboardViewed } from "@/lib/analytics";
import { STATUS_CONFIG } from "@/components/dashboard/RequestCard";
import EntertainmentRail from "@/components/clientDashboard/EntertainmentRail";
import DashboardNotificationCenter from "@/components/clientDashboard/DashboardNotificationCenter";

const ACTIVE_STATUSES = new Set(["pending", "media_pending", "media_required", "reviewing", "pending_review", "performer_approval_pending", "quote_pending", "quote_issued", "approved", "reservation_pending", "reservation_paid", "scheduled", "confirmed"]);

const liveShows = [
  { id: "live-main", title: "FLESHLAB Live", description: "Creator sessions, studio energy and upcoming live drops.", href: "/live" },
  { id: "fitmaster", title: "Fitmaster Live", description: "Fitness-driven creator sessions and premium live moments.", href: "/live/fitmaster" },
];

const collections = [
  { id: "hotel", title: "Hotel Sessions", description: "Private-room stories, cinematic tension and creator-led productions.", href: "/videos?collection=hotel" },
  { id: "guest", title: "Fan Productions", description: "Real fan requests, studio review and curated fantasy productions.", href: "/fan-productions" },
  { id: "fanclub", title: "Fanclub Exclusives", description: "Subscriber-first drops and creator-focused premium access.", href: "/fanclub" },
  { id: "studio", title: "Studio Releases", description: "Latest official FLESHLAB productions and creator spotlights.", href: "/videos" },
];

function Hero({ user, video, newCount }) {
  const firstName = user?.full_name && user.full_name !== user.email ? user.full_name.split(" ")[0] : "there";
  const heroImage = video?.cover_image_url || video?.primary_thumbnail_url || "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/96230e13e_generated_image.png";

  return (
    <section className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-black/40">
      <img src={heroImage} alt="FLESHLAB featured production" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-[3000ms] hover:scale-105" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#030507_0%,rgba(3,5,7,0.92)_34%,rgba(3,5,7,0.35)_68%,rgba(3,5,7,0.82)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05070a] to-transparent" />
      <div className="relative flex min-h-[430px] max-w-2xl flex-col justify-center p-6 md:p-10">
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#f0183d]/30 bg-[#12060a]/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d] backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Amateur Wins
        </div>
        <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">Welcome back, {firstName}.</h1>
        <p className="mt-5 max-w-lg text-lg leading-7 text-white/72">{newCount} new productions have been released since your last visit. Ready for another session?</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={video?.slug ? `/videos/${video.slug}` : "/videos"} onClick={() => trackDashboardCtaClick("continue_watching", video?.slug ? `/videos/${video.slug}` : "/videos")}>
            <Button className="h-12 rounded-full bg-white px-6 font-black text-black hover:bg-white/90"><Play className="mr-2 h-4 w-4 fill-black" /> Continue Watching</Button>
          </Link>
          <Link to="/videos"><Button variant="outline" className="h-12 rounded-full border-white/20 bg-black/25 px-6 font-black text-white hover:bg-white/10">Discover More</Button></Link>
        </div>
      </div>
    </section>
  );
}

function PersonalSignal({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <Icon className="mb-4 h-5 w-5 text-[#f0183d]" />
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/36">{label}</div>
    </div>
  );
}

export default function OverviewTab({ requests, subscriptions, payments, user, loading, setActiveTab }) {
  const [latestVideos, setLatestVideos] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [fallbackVideos, setFallbackVideos] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [news, setNews] = useState([]);

  useEffect(() => {
    trackDashboardViewed(window.location.pathname.includes("onboarding") ? "onboarding" : "direct");
    Promise.all([
      base44.entities.Video.filter({ status: "published" }, "-published_at", 18),
      base44.entities.Video.filter({ status: "published" }, "-view_count", 18),
      base44.entities.Video.list("-updated_date", 60),
      base44.entities.Performer.filter({ status: "active" }, "-video_count", 10),
      base44.entities.NewsArticle.filter({ status: "published" }, "-published_at", 6),
    ]).then(([latest, trending, fallback, creators, articles]) => {
      setLatestVideos(latest || []);
      setTrendingVideos(trending || []);
      setFallbackVideos(fallback || []);
      setPerformers(creators || []);
      setNews(articles || []);
    });
  }, []);

  const hasActiveSub = subscriptions.some((s) => s.status === "active" && s.current_period_end && new Date(s.current_period_end) > new Date());
  const activeRequests = requests.filter((r) => ACTIVE_STATUSES.has(r.status));
  const latestRequest = activeRequests[0];

  const dashboardVideos = useMemo(() => {
    const used = new Set();
    const canUse = (video) => video?.slug && !used.has(video.id) && !used.has(video.slug);
    const markUsed = (video) => {
      if (video.id) used.add(video.id);
      if (video.slug) used.add(video.slug);
    };
    const take = (sources, count) => {
      const result = [];
      for (const source of sources) {
        for (const video of source || []) {
          if (!canUse(video)) continue;
          markUsed(video);
          result.push(video);
          if (result.length >= count) return result;
        }
      }
      return result;
    };

    const featured = take([latestVideos, trendingVideos, fallbackVideos], 1)[0] || null;

    return {
      featured,
      continueWatching: take([latestVideos, fallbackVideos], 6),
      trending: take([trendingVideos, fallbackVideos], 8),
      recommended: take([latestVideos, trendingVideos, fallbackVideos], 8),
      latest: take([latestVideos, fallbackVideos], 8),
      collections: take([fallbackVideos, trendingVideos, latestVideos], 6),
    };
  }, [latestVideos, trendingVideos, fallbackVideos]);

  const notifications = useMemo(() => {
    const status = latestRequest ? STATUS_CONFIG[latestRequest.status] || STATUS_CONFIG.pending : null;
    return [
      dashboardVideos.featured && { type: "release", title: "New release", body: `${dashboardVideos.featured.title} is now available to watch.`, href: `/videos/${dashboardVideos.featured.slug}` },
      { type: "live", title: "Upcoming live show", body: "FLESHLAB Live has sessions and special drops ready to explore.", href: "/live" },
      news[0] && { type: "update", title: "Platform update", body: news[0].title, href: `/news/${news[0].slug}` },
      latestRequest && { type: "message", title: "Fan Production update", body: status?.label || "Your request has a new studio status.", href: "#" },
      payments[0] && { type: "payment", title: "Payment confirmation", body: "Your latest payment activity is saved in your account.", href: "#" },
    ].filter(Boolean);
  }, [dashboardVideos.featured, news, latestRequest, payments]);

  return (
    <div className="space-y-10 pb-12">
      <Hero user={user} video={dashboardVideos.featured} newCount={Math.min(3, latestVideos.length || fallbackVideos.length || 3)} />

      <div className="grid gap-3 md:grid-cols-4">
        <PersonalSignal icon={Heart} label="Favourite creators" value={performers.length ? performers.slice(0, 3).length : "—"} />
        <PersonalSignal icon={Bookmark} label="Watchlist mood" value={hasActiveSub ? "Premium" : "Explore"} />
        <PersonalSignal icon={Globe2} label="Region" value={user?.country || "Local"} />
        <PersonalSignal icon={CalendarDays} label="Active requests" value={loading ? "—" : activeRequests.length} />
      </div>

      <DashboardNotificationCenter items={notifications} />

      <EntertainmentRail title="Continue Watching" subtitle="Pick up where your next FLESHLAB session begins." items={dashboardVideos.continueWatching} />
      <EntertainmentRail title="New From Favourite Creators" subtitle="Creator-led releases and profiles selected for you." items={performers.slice(0, 8)} type="creator" />
      <EntertainmentRail title="Trending" subtitle="What the FLESHLAB audience is watching now." items={dashboardVideos.trending} />
      <EntertainmentRail title="Recommended For You" subtitle="Based on your activity, country, collections and recent visits." items={dashboardVideos.recommended} />
      <EntertainmentRail title="Latest Releases" subtitle="Fresh productions from the FLESHLAB ecosystem." items={dashboardVideos.latest} />
      <EntertainmentRail title="Upcoming Live Shows" subtitle="Live sessions and special creator events." items={liveShows} type="live" />
      <EntertainmentRail title="Collections" subtitle="Curated worlds for your next click." items={dashboardVideos.collections.length ? dashboardVideos.collections : collections} type={dashboardVideos.collections.length ? "video" : "collection"} />
      <EntertainmentRail title="Suggested Creators" subtitle="Discover performers connected to your FLESHLAB journey." items={performers.slice(2, 10)} type="creator" />
      <EntertainmentRail title="News" subtitle="Official updates, platform drops and creator announcements." items={news.slice(0, 6)} type="news" />

      <section className="rounded-[2rem] border border-[#f0183d]/25 bg-[#12060a] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">Your next move</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">Create a fantasy production request</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/54">Turn the dashboard into action when you are ready — request a curated FLESHLAB production with studio review.</p>
          </div>
          <Button onClick={() => window.location.href = "/fan-productions/request"} className="h-12 rounded-full bg-[#f0183d] px-6 font-black text-white hover:bg-[#ff3152]">Start Request <ChevronRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </section>
    </div>
  );
}