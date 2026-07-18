import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Clapperboard,
  Flame,
  Globe2,
  Library,
  Lightbulb,
  Megaphone,
  PlayCircle,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Video,
  Zap,
} from "lucide-react";

const fitmasterNames = ["thefitmaster", "fitmaster", "the fitmaster"];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dayLabel(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(value) {
  if (!value) return "Now";
  return new Date(value).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function isFitmaster(performer) {
  const text = `${performer?.display_name || ""} ${performer?.slug || ""}`.toLowerCase();
  return fitmasterNames.some((name) => text.includes(name));
}

function Panel({ title, eyebrow, children, className = "", action }) {
  return (
    <section className={`rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">{eyebrow}</p>}
          <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.04em] text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PriorityItem({ item, index }) {
  const tones = ["bg-[#f0183d]", "bg-orange-400", "bg-yellow-300", "bg-emerald-400", "bg-emerald-500"];
  return (
    <Link to={item.href} className="group grid grid-cols-[12px_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#f0183d]/65 hover:bg-[#14070a] hover:shadow-[0_0_42px_rgba(240,24,61,0.16)]">
      <span className={`h-3 w-3 rounded-full ${tones[index] || "bg-white/40"}`} />
      <div>
        <p className="text-sm font-black uppercase tracking-[-0.01em] text-white">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-white/48">{item.context}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/34 transition group-hover:translate-x-1 group-hover:text-[#f0183d]" />
    </Link>
  );
}

function Metric({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/28 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/48">{note}</p>
    </div>
  );
}

function CommandLink({ icon: Icon, label, value, href }) {
  return (
    <Link to={href} className="group rounded-2xl border border-white/10 bg-black/24 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#f0183d]/55 hover:bg-black/38">
      <Icon className="mb-4 h-5 w-5 text-[#f0183d]" />
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-white">{value}</p>
    </Link>
  );
}

function LibraryCard({ label, value, href, icon: Icon }) {
  return (
    <Link to={href} className="group min-h-[132px] rounded-2xl border border-white/10 bg-black/28 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#f0183d]/60 hover:bg-[#120609]">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-[#f0183d]" />
        <ArrowRight className="h-4 w-4 text-white/28 transition group-hover:translate-x-1 group-hover:text-[#f0183d]" />
      </div>
      <p className="mt-6 text-2xl font-black tracking-[-0.06em] text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/52">{label}</p>
    </Link>
  );
}

function AdviceCard({ advice, onIgnore }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="rounded-2xl border border-[#f0183d]/25 bg-[#140609] p-4">
      <div className="flex gap-3">
        <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-[#f0183d]" />
        <div>
          <p className="text-sm font-semibold leading-6 text-white/86">{advice.text}</p>
          {expanded && <p className="mt-3 text-xs leading-5 text-white/50">{advice.explain}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={advice.reviewHref} className="rounded-full bg-[#f0183d] px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white">Review</Link>
        <Link to="/admin/ai-media-studio" className="rounded-full border border-white/12 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white/70 transition hover:border-[#f0183d]/60 hover:text-white">Generate Campaign</Link>
        <button onClick={() => setExpanded(!expanded)} className="rounded-full border border-white/12 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white">Explain</button>
        <button onClick={onIgnore} className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white/38 transition hover:text-white/70">Ignore</button>
      </div>
    </article>
  );
}

function FeedItem({ item }) {
  return (
    <div className="grid grid-cols-[54px_18px_1fr] gap-3">
      <time className="pt-0.5 text-[10px] font-black uppercase tracking-wide text-white/38">{item.time}</time>
      <div className="flex flex-col items-center">
        <span className="h-3 w-3 rounded-full bg-[#f0183d] shadow-[0_0_18px_rgba(240,24,61,0.8)]" />
        <span className="mt-2 h-full w-px bg-white/10" />
      </div>
      <Link to={item.href} className="group pb-5">
        <p className="text-sm font-bold text-white transition group-hover:text-[#f0183d]">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-white/42">{item.context}</p>
      </Link>
    </div>
  );
}

function HQAIPanel({ priorities }) {
  const prompts = [
    { label: "What should we focus on today?", answer: priorities[0]?.title || "Start with the production queue, then move to discovery and library optimization.", href: priorities[0]?.href || "/admin/videos", cta: "Open Priority" },
    { label: "Show me underperforming content.", answer: "Open the metadata and SEO queue. Those assets are the fastest path from dead library value to promotable releases.", href: "/admin/video-metadata-completion", cta: "Open Content Queue" },
    { label: "Generate Hotel campaign.", answer: "Use AI Media Studio for the Hotel Sessions campaign so the output becomes production and promo assets, not generic video copy.", href: "/admin/ai-media-studio", cta: "Open AI Media Studio" },
    { label: "Why is revenue down?", answer: "Check revenue, then compare it against recent releases and promotion gaps. The HQ view should connect money to actions, not charts.", href: "/admin/revenue", cta: "Open Business" },
    { label: "Prepare tomorrow.", answer: "Review automation activity and today’s unfinished priorities, then choose one production action, one library action and one discovery action for tomorrow.", href: "/admin/live-activity", cta: "Open Automation" },
  ];
  const [activePrompt, setActivePrompt] = useState(prompts[0]);
  return (
    <aside className="sticky top-6 h-[calc(100vh-3rem)] rounded-[30px] border border-white/10 bg-black/46 p-5 shadow-[0_34px_110px_rgba(0,0,0,0.46)] backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f0183d] shadow-[0_0_42px_rgba(240,24,61,0.35)]"><Bot className="h-6 w-6 text-white" /></div>
        <div>
          <p className="text-sm font-black uppercase tracking-[-0.02em] text-white">HQ AI</p>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f0183d]">Company advisor</p>
        </div>
      </div>
      <p className="mt-6 text-sm leading-6 text-white/62">The operating system is watching production, library, discovery, AI output and growth signals.</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/38">First recommendation</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-white/82">{priorities[0]?.title || "Review today’s production queue before opening analytics."}</p>
      </div>
      <div className="mt-6 space-y-2">
        {prompts.map((prompt) => <button key={prompt.label} onClick={() => setActivePrompt(prompt)} className={`block w-full rounded-2xl border p-3 text-left text-xs font-semibold leading-5 transition ${activePrompt.label === prompt.label ? "border-[#f0183d]/70 bg-[#140609] text-white" : "border-white/10 bg-black/24 text-white/64 hover:border-[#f0183d]/55 hover:text-white"}`}>{prompt.label}</button>)}
      </div>
      <div className="mt-6 rounded-2xl border border-[#f0183d]/25 bg-[#120609] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0183d]">HQ response</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-white/78">{activePrompt.answer}</p>
        <Link to={activePrompt.href} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f0183d] px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white">{activePrompt.cta} <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </aside>
  );
}

export default function Dashboard() {
  const [ignoredAdvice, setIgnoredAdvice] = useState({});

  const { data = {}, isLoading } = useQuery({
    queryKey: ["fleshlab-hq"],
    queryFn: async () => {
      const [stats, performers, videos, applications, recommendations, missions] = await Promise.all([
        base44.entities.SystemStat.list("-last_refreshed_at", 1),
        base44.entities.Performer.list("-updated_date", 80),
        base44.entities.Video.list("-updated_date", 180),
        base44.entities.GuestProductionApplication.list("-created_date", 80),
        base44.entities.ContentRecommendation.list("-generated_at", 40),
        base44.entities.CreatorProductionMission.list("-generated_at", 20),
      ]);
      return { stat: stats[0] || null, performers, videos, applications, recommendations, missions };
    },
  });

  const stat = data.stat || null;
  const performers = data.performers || [];
  const videos = data.videos || [];
  const applications = data.applications || [];
  const recommendations = data.recommendations || [];
  const missions = data.missions || [];

  const fitmaster = performers.find(isFitmaster) || performers[0];
  const drafts = videos.filter((video) => video.status !== "published");
  const published = videos.filter((video) => video.status === "published");
  const missingMetadata = videos.filter((video) => !video.meta_title || !video.meta_description || !video.description);
  const missingThumbnail = videos.filter((video) => !video.primary_thumbnail_url && !video.cover_image_url);
  const needsSeo = videos.filter((video) => video.status === "published" && (!video.meta_title || !video.meta_description));
  const newCandidates = applications.filter((app) => ["pending", "media_pending", "reviewing"].includes(app.status || "pending"));
  const highPriorityCandidates = applications.filter((app) => app.status === "reviewing" || app.status === "media_pending");
  const todayMissions = missions.filter((mission) => mission.mission_date === todayKey() || mission.status === "active");
  const latestUpload = videos[0];
  const latestFitmasterMission = todayMissions.find((mission) => mission.performer_id === fitmaster?.id) || todayMissions[0];

  const priorities = useMemo(() => [
    drafts.length && { title: `Approve ${drafts[0]?.title || "draft release"}`, context: `${drafts.length} draft item${drafts.length === 1 ? "" : "s"} waiting for production review.`, href: drafts[0]?.id ? `/admin/videos/${drafts[0].id}` : "/admin/draft-review" },
    missingMetadata.length && { title: "Update creator metadata", context: `${missingMetadata.length} video${missingMetadata.length === 1 ? "" : "s"} need stronger descriptions, SEO or release copy.`, href: "/admin/video-metadata-completion" },
    highPriorityCandidates.length && { title: "Review discovery candidates", context: `${highPriorityCandidates.length} recruitment lead${highPriorityCandidates.length === 1 ? "" : "s"} need a decision.`, href: "/admin/applications" },
    missingThumbnail.length && { title: "Fix thumbnail queue", context: `${missingThumbnail.length} library asset${missingThumbnail.length === 1 ? "" : "s"} need cover attention.`, href: "/admin/asset-repair-queue" },
    latestFitmasterMission && { title: latestFitmasterMission.title || "Review TheFitmaster mission", context: latestFitmasterMission.description || "Open the active creator mission and move production forward.", href: "/admin/performers" },
  ].filter(Boolean).slice(0, 5), [drafts, missingMetadata, highPriorityCandidates, missingThumbnail, latestFitmasterMission]);

  const advice = [
    missingMetadata.length > 0 && { id: "metadata", text: `Your legacy catalog has ${missingMetadata.length} videos that need stronger metadata before promotion.`, explain: "Metadata gaps block SEO, partner distribution and campaign generation. Fixing these creates more surfaces for the library to earn from existing assets.", reviewHref: "/admin/video-metadata-completion" },
    needsSeo.length > 0 && { id: "seo", text: `${needsSeo.length} published videos can be improved for search and discovery today.`, explain: "Published content should not sit idle. Strong titles, descriptions and internal links turn legacy releases into growth assets.", reviewHref: "/admin/growth" },
    newCandidates.length > 0 && { id: "discovery", text: `${newCandidates.length} recruitment opportunities are waiting in discovery.`, explain: "Recruitment is a current growth lever. Review active candidates before opening broad analytics.", reviewHref: "/admin/applications" },
  ].filter(Boolean).filter((item) => !ignoredAdvice[item.id]);

  const feed = [
    latestUpload && { time: timeLabel(latestUpload.updated_date || latestUpload.created_date), title: "Latest upload updated", context: latestUpload.title, href: latestUpload.id ? `/admin/videos/${latestUpload.id}` : "/admin/videos" },
    recommendations[0] && { time: timeLabel(recommendations[0].generated_at || recommendations[0].created_date), title: "AI recommendation generated", context: recommendations[0].title, href: "/admin/ai-text-generator" },
    applications[0] && { time: timeLabel(applications[0].created_date || applications[0].submitted_at), title: "Recruitment signal received", context: applications[0].applicant_name || applications[0].email || "New application", href: "/admin/applications" },
    stat?.last_refreshed_at && { time: timeLabel(stat.last_refreshed_at), title: "Business pulse refreshed", context: "System stats updated for HQ view.", href: "/admin/live-activity" },
  ].filter(Boolean);

  return (
    <>
      <SEOMeta title="FLESHLAB HQ" description="FLESHLAB Studios headquarters operating system." canonical="/admin" noIndex={true} />
      <div className="min-h-full rounded-[32px] bg-[radial-gradient(circle_at_20%_0%,rgba(240,24,61,0.20),transparent_34%),radial-gradient(circle_at_80%_16%,rgba(255,255,255,0.08),transparent_26%),#030506] p-4 text-white md:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-6">
            <header className="relative overflow-hidden rounded-[34px] border border-white/10 bg-black/36 p-6 shadow-[0_34px_120px_rgba(0,0,0,0.38)] md:p-8">
              <div className="absolute right-8 top-5 hidden text-[118px] font-black uppercase leading-none tracking-[-0.09em] text-white/[0.035] md:block">HQ</div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">FLESHLAB STUDIOS HEADQUARTERS</p>
              <h1 className="mt-4 text-[48px] font-black uppercase leading-[0.88] tracking-[-0.075em] text-white md:text-[84px]">Good Morning,<br />Eric</h1>
              <div className="mt-6 max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/44">Today</p>
                <p className="mt-2 text-xl font-semibold leading-8 text-white/76">Everything you need to move FLESHLAB forward.</p>
              </div>
            </header>

            <Panel title="Today's Priorities" eyebrow="First on screen" action={<span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white/42">Max 5</span>}>
              {isLoading ? <p className="text-sm text-white/50">Reading today’s operating signals…</p> : priorities.length ? <div className="space-y-3">{priorities.map((item, index) => <PriorityItem key={item.title} item={item} index={index} />)}</div> : <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-white/66">No critical blockers are visible. Open the library or discovery workflow to create the next move.</div>}
            </Panel>

            <Panel title="TheFitmaster Command Center" eyebrow="Active creator workspace">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <CommandLink icon={Clapperboard} label="Current Project" value={latestFitmasterMission?.title || latestUpload?.title || "Hotel Sessions"} href={fitmaster?.id ? `/admin/performers/${fitmaster.id}` : "/admin/performers"} />
                <CommandLink icon={Flame} label="Upload Streak" value={`${number(published.length)} releases live`} href="/admin/videos" />
                <CommandLink icon={PlayCircle} label="Today's Mission" value={latestFitmasterMission?.mission_type || "Prepare next release"} href="/admin/performers" />
                <CommandLink icon={ShieldCheck} label="Pending Review" value={`${number(drafts.length)} draft${drafts.length === 1 ? "" : "s"}`} href="/admin/draft-review" />
                <CommandLink icon={TrendingUp} label="Revenue Trend" value="Watch today" href="/admin/revenue" />
                <CommandLink icon={Globe2} label="Platform Status" value={fitmaster?.account_status || "Active"} href={fitmaster?.id ? `/admin/performers/${fitmaster.id}` : "/admin/performers"} />
                <CommandLink icon={Video} label="Series Progress" value="Hotel Sessions" href="/admin/videos" />
                <CommandLink icon={Upload} label="Latest Upload" value={latestUpload?.title || "No upload yet"} href={latestUpload?.id ? `/admin/videos/${latestUpload.id}` : "/admin/videos"} />
                <CommandLink icon={Megaphone} label="Upcoming Release" value={drafts[0]?.title || "Choose next asset"} href={drafts[0]?.id ? `/admin/videos/${drafts[0].id}` : "/admin/videos"} />
                <CommandLink icon={CheckCircle2} label="Creator Health" value={fitmaster?.account_status === "active" || !fitmaster ? "Operational" : fitmaster.account_status} href={fitmaster?.id ? `/admin/performers/${fitmaster.id}` : "/admin/performers"} />
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <Panel title="Business Pulse" eyebrow="Only what matters">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="Today" value={number(priorities.length)} note="Actions requiring attention now." />
                  <Metric label="This Week" value={number(newCandidates.length + drafts.length)} note="Recruitment and release work in motion." />
                  <Metric label="This Month" value={number(stat?.total_videos || videos.length)} note="Library assets available to convert." />
                  <Metric label="Goal" value="Ship" note="Produce, publish, promote, recruit." />
                </div>
              </Panel>

              <Panel title="Discovery" eyebrow="Recruitment command">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric label="New Candidates" value={number(newCandidates.length)} note="Fresh opportunities." />
                  <Metric label="High Priority" value={number(highPriorityCandidates.length)} note="Needs decision." />
                  <Metric label="Needs Review" value={number(applications.length)} note="Total pipeline." />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link to="/admin/applications" className="rounded-2xl border border-white/10 bg-black/28 p-4 transition hover:border-[#f0183d]/60"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0183d]">Today's Mission</p><p className="mt-2 text-sm font-semibold text-white/78">Review candidates before broad growth work.</p></Link>
                  <Link to="/admin/growth" className="rounded-2xl border border-white/10 bg-black/28 p-4 transition hover:border-[#f0183d]/60"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0183d]">Run Discovery</p><p className="mt-2 text-sm font-semibold text-white/78">Open growth signals and recruitment channels.</p></Link>
                </div>
              </Panel>
            </div>

            <Panel title="Content Library" eyebrow="Legacy value workspace">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <LibraryCard icon={Library} label="Legacy Videos" value={number(stat?.total_videos || videos.length)} href="/admin/videos" />
                <LibraryCard icon={Clapperboard} label="Series" value="Hotel" href="/admin/videos" />
                <LibraryCard icon={Sparkles} label="Unoptimized Videos" value={number(missingMetadata.length)} href="/admin/video-metadata-completion" />
                <LibraryCard icon={Video} label="Needs Thumbnail" value={number(missingThumbnail.length)} href="/admin/asset-repair-queue" />
                <LibraryCard icon={Search} label="Needs SEO" value={number(needsSeo.length)} href="/admin/growth" />
                <LibraryCard icon={Megaphone} label="Needs Promotion" value={number(published.length)} href="/admin/ai-text-generator" />
                <LibraryCard icon={Globe2} label="Needs Translation" value="Queue" href="/admin/ai-text-generator" />
                <LibraryCard icon={RefreshCw} label="Needs Remaster" value={number(missingThumbnail.length)} href="/admin/asset-repair-queue" />
                <LibraryCard icon={Zap} label="AI Drafts" value={number(recommendations.length)} href="/admin/draft-review" />
                <LibraryCard icon={Radar} label="Repair Queue" value={number(missingThumbnail.length)} href="/admin/legacy-assets" />
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <Panel title="AI Intelligence" eyebrow="Company advisor">
                {advice.length ? <div className="space-y-3">{advice.slice(0, 3).map((item) => <AdviceCard key={item.id} advice={item} onIgnore={() => setIgnoredAdvice((prev) => ({ ...prev, [item.id]: true }))} />)}</div> : <div className="rounded-2xl border border-white/10 bg-black/24 p-4 text-sm text-white/56">No urgent AI recommendations remain in this view.</div>}
              </Panel>

              <Panel title="Operations Feed" eyebrow="Live timeline">
                {feed.length ? <div>{feed.map((item, index) => <FeedItem key={`${item.title}-${index}`} item={item} />)}</div> : <p className="text-sm text-white/50">No operating events yet today.</p>}
              </Panel>
            </div>
          </div>

          <HQAIPanel priorities={priorities} />
        </div>
      </div>
    </>
  );
}