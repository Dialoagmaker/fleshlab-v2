import React from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categoryLabels = {
  studioUpdates: "Platform Update",
  creatorStories: "Creator Announcement",
  fanclub: "Community Update",
  guestProduction: "New Release",
  behindTheScenes: "Studio News",
  production: "New Release",
  casting: "Creator Announcement",
  platformNews: "Feature Rollout",
  pressRelease: "Press Release"
};

function formatDate(value) {
  if (!value) return "Current";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NewsCard({ article, featured = false }) {
  const categoryLabel = categoryLabels[article.category] || article.category || "Studio News";
  const summary = article.excerpt || article.short_summary || article.meta_description;
  const date = article.published_at || article.created_date;

  return (
    <a href={`/news/${article.slug}`} className="group block">
      <article className={`border border-white/10 bg-[#080b0e] transition duration-300 hover:border-[#f0183d]/60 ${featured ? "rounded-[1.75rem] p-7 md:p-10" : "rounded-2xl p-5 md:p-6"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="rounded-full bg-[#f0183d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#f0183d]">
            {featured ? "Featured Update" : categoryLabel}
          </Badge>
          {featured && <Badge className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/62 hover:bg-white/[0.04]">{categoryLabel}</Badge>}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44">
            <Calendar className="h-3.5 w-3.5" /> {formatDate(date)}
          </span>
        </div>

        <h2 className={`${featured ? "mt-7 max-w-5xl text-4xl md:text-6xl" : "mt-5 text-2xl"} font-black leading-[0.98] tracking-[-0.035em] text-white transition group-hover:text-[#f0183d]`}>
          {article.title}
        </h2>

        {summary && <p className={`${featured ? "mt-6 max-w-3xl text-base md:text-lg" : "mt-4 text-sm"} leading-7 text-white/58 line-clamp-3`}>{summary}</p>}

        <div className="mt-7 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#f0183d] transition group-hover:gap-4">
          Read Update <ArrowRight className="h-4 w-4" />
        </div>
      </article>
    </a>
  );
}