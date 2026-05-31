import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Queries up to 6 ready trailer/preview assets from published videos.
// Cycles through them softly. Fully silent fallback on error or empty data.
export default function HeroBackgroundSampler() {
  const videoRef = useRef(null);
  const [clipIndex, setClipIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Disable background video on mobile — too heavy, layout risk
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { data: assets = [] } = useQuery({
    queryKey: ["hero-sampler-assets"],
    queryFn: () =>
      base44.entities.VideoAsset.filter(
        { asset_type: "trailer", status: "ready" },
        "-created_date",
        6
      ),
    staleTime: 5 * 60 * 1000,
  });

  // Shuffle once on mount so order varies per visit
  const clips = useRef([]);
  useEffect(() => {
    if (assets.length === 0) return;
    const urls = assets
      .map(a => a.cdn_url)
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    clips.current = urls;
    setClipIndex(0);
  }, [assets]);

  // Load a new clip whenever clipIndex changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || clips.current.length === 0 || isMobile) return;

    const url = clips.current[clipIndex % clips.current.length];
    if (!url) return;

    setVisible(false);

    video.src = url;
    video.load();

    const onPlaying = () => setVisible(true);
    const onError = () => setVisible(false);

    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    video.play().catch(() => setVisible(false));

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
    };
  }, [clipIndex, isMobile]);

  // Cycle clips every 10 seconds
  useEffect(() => {
    if (clips.current.length <= 1 || isMobile) return;
    const interval = setInterval(() => {
      setClipIndex(i => i + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, [assets, isMobile]);

  // Don't render anything on mobile or if no clips
  if (isMobile || assets.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: visible ? 0.18 : 0 }}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
      />
    </div>
  );
}