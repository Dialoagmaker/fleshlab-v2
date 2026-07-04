import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import VideoCard from "./VideoCard";

// Larger-format rail for high-conversion sections (fewer, bigger cards).
export default function LargeVideoRail({
  title,
  subtitle,
  videos = [],
  brands = [],
  performers = [],
  viewAllLink,
  viewAllText = "View All"
}) {
  if (!videos || videos.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="inline-flex items-center gap-1.5 text-primary font-medium hover:text-primary/80 transition-colors"
          >
            {viewAllText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            brands={brands}
            performers={performers}
          />
        ))}
      </div>
    </section>
  );
}