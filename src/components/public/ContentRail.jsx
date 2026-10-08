import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import VideoCard from "./VideoCard";
import SectionHeader from "./SectionHeader";

export default function ContentRail({ 
  title, 
  subtitle, 
  videos = [], 
  brands = [], 
  performers = [],
  viewAllLink,
  viewAllText = "View All",
  emptyMessage = "Content coming soon"
}) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        viewAllLink={viewAllLink}
        viewAllText={viewAllText}
      />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
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