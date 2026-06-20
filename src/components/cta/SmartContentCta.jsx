import { Star, Play, User, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

const CTAS = {
  videos: {
    icon: Play,
    title: "Enjoying the content?",
    subtitle: "Unlock full Fanclub access for $12.99/month",
    cta: "Join Fanclub",
    href: "/fanclub",
    event: "fanclub_cta_clicked",
    eventParams: { cta_location: "video_page" },
  },
  performers: {
    icon: User,
    title: "Want to see more from this performer?",
    subtitle: "Join Fanclub",
    cta: "Join Fanclub",
    href: "/fanclub",
    event: "fanclub_cta_clicked",
    eventParams: { cta_location: "performer_page" },
  },
  news: {
    icon: Newspaper,
    title: "Watch exclusive content from our performers.",
    subtitle: "Join Fanclub",
    cta: "Join Fanclub",
    href: "/fanclub",
    event: "fanclub_cta_clicked",
    eventParams: { cta_location: "news_page" },
  },
};

export default function SmartContentCta({ contentType, user, hasActiveSub }) {
  if (!user || hasActiveSub || !contentType) return null;

  const isAdmin = user.role === "admin";
  if (isAdmin) return null;

  const config = CTAS[contentType];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-white/6 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center">
          <Icon className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">{config.title}</h3>
          <p className="text-white/40 text-sm">{config.subtitle}</p>
        </div>
      </div>
      <Link
        to={config.href}
        onClick={() => trackEvent(config.event, config.eventParams)}
        className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5"
      >
        <Star className="w-4 h-4 fill-white" />
        {config.cta}
      </Link>
    </div>
  );
}