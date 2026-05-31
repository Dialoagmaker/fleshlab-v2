import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewsCard({ article }) {
  return (
    <Link to={`/news/${article.slug}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300">
        {/* Cover Image */}
        <div className="relative aspect-video bg-secondary overflow-hidden">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">📰</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {article.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {article.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
            <span className={cn(
              "px-2 py-1 rounded-full",
              article.status === 'published' 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-muted text-muted-foreground'
            )}>
              {article.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}