import React from "react";
import { Calendar, ArrowRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categoryLabels = {
  studioUpdates: "Studio Update",
  creatorStories: "Performer Story",
  fanclub: "Fanclub",
  guestProduction: "Guest Production",
  behindTheScenes: "Behind the Scenes",
  production: "Production",
  casting: "Casting",
  platformNews: "Platform News"
};

export default function NewsCard({ article, featured = false }) {
  const categoryLabel = categoryLabels[article.category] || article.category || "News";

  if (featured) {
    return (
      <a href={`/news/${article.slug}`} className="group block">
        <div className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(180,30,50,0.15)]">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Side */}
            <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden bg-muted">
              {article.cover_image_url ? (
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
                  <span className="text-6xl opacity-10">✦</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Content Side */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="space-y-4">
                {article.category && (
                  <Badge className="bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
                    {categoryLabel}
                  </Badge>
                )}

                <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-primary transition-colors leading-tight">
                  {article.title}
                </h2>

                {article.excerpt && (
                  <p className="text-muted-foreground leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  {article.published_at && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(article.published_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  )}
                  
                  <span className="text-primary font-semibold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                    Read Update <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    );
  }

  // Standard Card
  return (
    <a href={`/news/${article.slug}`} className="group block h-full">
      <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(180,30,50,0.15)] h-full flex flex-col">
        {/* Cover image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
              width="640"
              height="360"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
              <span className="text-4xl opacity-10">✦</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 flex-1 flex flex-col">
          <div className="space-y-2 flex-1">
            {article.category && (
              <Badge className="bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
                {categoryLabel}
              </Badge>
            )}

            <h3 className="font-bold text-white text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>

            {article.excerpt && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            {article.published_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </span>
            )}
            
            <span className="text-primary font-semibold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
              Read More <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}