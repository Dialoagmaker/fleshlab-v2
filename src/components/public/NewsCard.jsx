import React from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EditorialThumbnail from "@/components/public/EditorialThumbnail";

const categoryLabels = { studioUpdates: "Platform Update", creatorStories: "Creator Announcement", fanclub: "Community Update", guestProduction: "New Release", behindTheScenes: "Studio News", production: "New Release", casting: "Creator Announcement", platformNews: "Feature Rollout", pressRelease: "Press Release", partnerships: "Partnership", events: "Event" };

function formatDate(value) {
  if (!value) return "Current";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NewsCard({ article, featured = false, variant = "default" }) {
  const categoryLabel = categoryLabels[article.category] || article.category || "Studio News";
  const summary = article.excerpt || article.short_summary || article.meta_description;
  const date = article.published_at || article.created_date;
  const compact = variant === "compact";
  const layout = featured ? "grid gap-6 p-5 md:grid-cols-[1.12fr_0.88fr] md:p-7" : compact ? "grid gap-4 p-4 md:grid-cols-[180px_1fr]" : "p-4";

  return (
    <a href={`/news/${article.slug}`} className="group block h-full">
      <article className={`h-full overflow-hidden border border-white/10 bg-[#080b0e] transition duration-300 hover:-translate-y-1 hover:border-[#f0183d]/60 ${featured ? "rounded-[1.75rem]" : "rounded-2xl"} ${layout}`}>
        <EditorialThumbnail article={article} featured={featured} compact={compact} />
        <div className={featured ? "flex flex-col justify-center p-2 md:p-5" : compact ? "flex flex-col justify-center" : "p-4 pt-5"}>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-[#f0183d] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#f0183d]">{featured ? "Featured Story" : categoryLabel}</Badge>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/44"><Calendar className="h-3.5 w-3.5" /> {formatDate(date)}</span>
          </div>
          <h2 className={`${featured ? "mt-6 text-4xl md:text-6xl" : compact ? "mt-4 text-xl" : "mt-5 text-3xl"} font-black leading-[0.96] tracking-[-0.04em] text-white transition group-hover:text-[#f0183d]`}>{article.title}</h2>
          {summary && <p className={`${featured ? "mt-6 text-base md:text-lg" : "mt-4 text-sm"} leading-7 text-white/58 line-clamp-3`}>{summary}</p>}
          <div className="mt-7 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#f0183d] transition group-hover:gap-4">Read Story <ArrowRight className="h-4 w-4" /></div>
        </div>
      </article>
    </a>
  );
}