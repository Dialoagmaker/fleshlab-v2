import VideoCard from "@/components/public/VideoCard";

export default function VideoRowSection({ title, videos, brands, performers, loading }) {
  if (!loading && (!videos || videos.length === 0)) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-black text-white mb-3 uppercase tracking-tight">{title}</h2>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-video bg-[#121212] rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} brands={brands} performers={performers} />
          ))}
        </div>
      )}
    </section>
  );
}