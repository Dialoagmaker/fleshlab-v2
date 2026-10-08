import React from "react";

const fallbackImages = {
  studioUpdates: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/96230e13e_generated_image.png",
  behindTheScenes: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b2a370cb_generated_image.png",
  creatorStories: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a3babcb65_generated_image.png",
  production: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d35df4180_generated_image.png",
  fanclub: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ee7e890ef_generated_image.png",
  pressRelease: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/5b2120e6a_generated_image.png",
  partnerships: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b2a370cb_generated_image.png",
  events: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/fcaf5cd40_generated_image.png",
};

export default function EditorialThumbnail({ article, featured = false, compact = false }) {
  const image = article.cover_image_url || article.featured_image_url || article.thumbnail_url || fallbackImages[article.category] || fallbackImages.studioUpdates;
  return (
    <div className={`relative overflow-hidden bg-black ${featured ? "min-h-[360px] rounded-[1.5rem]" : compact ? "h-full min-h-[160px] rounded-2xl" : "min-h-[270px] rounded-[1.35rem]"}`}>
      <img src={image} alt={article.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-82 brightness-[0.82] saturate-[0.88] transition duration-700 group-hover:scale-105 group-hover:opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(240,24,61,0.28),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.88))]" />
      <div className="absolute left-5 top-5 rounded-full border border-white/16 bg-black/35 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.28em] text-white/76 backdrop-blur">FLESHLAB</div>
      <div className="absolute bottom-5 left-5 right-5">
        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#f0183d]">Editorial Cover</p>
        {!compact && <p className="mt-2 line-clamp-2 text-2xl font-black uppercase leading-[0.92] tracking-[-0.045em] text-white md:text-3xl">{article.title}</p>}
      </div>
    </div>
  );
}