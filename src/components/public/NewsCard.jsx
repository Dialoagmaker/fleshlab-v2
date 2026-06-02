import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";

export default function NewsCard({ article }) {
  return (
    <Link to={`/news/${article.slug}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-[#111] border border-white/[0.07] hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(180,30,50,0.15)]">
        {/* Cover image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-[#0a0a0a]">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
              <span className="text-4xl opacity-10">✦</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {article.published_at && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/35">
              <Calendar className="w-3 h-3" />
              {new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          )}

          <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          <div className="pt-1 flex items-center gap-1.5 text-xs text-primary/70 group-hover:text-primary font-semibold transition-colors">
            Read Article <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}