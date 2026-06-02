import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import StudioGate from "@/components/public/StudioGate";
import StudioHeaderCompact from "@/components/public/StudioHeaderCompact";
import StudioMobileMenu from "@/components/public/StudioMobileMenu";
import StudioDropsRail from "@/components/public/StudioDropsRail";
import PreviewWall from "@/components/public/PreviewWall";
import PerformerWorldsGrid from "@/components/public/PerformerWorldsGrid";
import StudioJournalPreview from "@/components/public/StudioJournalPreview";
import JoinTheVault from "@/components/public/JoinTheVault";
import StudioFooter from "@/components/public/StudioFooter";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gateVisible, setGateVisible] = useState(true);

  // Fetch videos
  const { data: videosData } = useQuery({
    queryKey: ['public-videos-fn'],
    queryFn: () => callPublicFunction('getPublicVideos'),
    retry: 0,
  });
  const allVideos = videosData?.videos || [];

  // Fetch performers
  const { data: performersData } = useQuery({
    queryKey: ['public-performers-fn'],
    queryFn: () => callPublicFunction('getPublicPerformers'),
    retry: 0,
  });
  const allPerformers = performersData?.performers || [];

  // Fetch news
  const { data: newsData } = useQuery({
    queryKey: ['public-news-fn'],
    queryFn: () => callPublicFunction('getPublicNews'),
    retry: 0,
  });
  const allArticles = newsData?.articles || [];

  // Handle scroll for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check gate state on mount
  useEffect(() => {
    const hasEntered = sessionStorage.getItem('vaultEntered');
    if (hasEntered) {
      setGateVisible(false);
    }
  }, []);

  const handleGateEnter = () => {
    setGateVisible(false);
  };

  return (
    <>
      <SEOMeta
        title="FLESHLAB — Private Studio Archive | Asian Gay Content"
        description="FLESHLAB is a premium gay adult studio featuring verified Asian performers, exclusive productions, and member-only content. Enter the vault."
        canonical="/"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FLESHLAB",
          "url": "https://fleshlab.online",
          "description": "Premium gay adult studio featuring verified Asian performers, exclusive productions and member-only content."
        }}
      />

      <div className="min-h-screen bg-[#0A0A0A]">
        {/* Studio Gate (first visit only) */}
        {gateVisible && <StudioGate onEnter={handleGateEnter} />}

        {/* Compact Header (visible when gate is not showing) */}
        {!gateVisible && (
          <>
            <StudioHeaderCompact
              scrolled={scrolled}
              onMenuToggle={() => setMobileMenuOpen(true)}
            />
            <StudioMobileMenu
              open={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />
          </>
        )}

        {/* Main Content */}
        <div className={!gateVisible ? "pt-16" : ""}>
          {/* Studio Drops */}
          <StudioDropsRail videos={allVideos} />

          {/* Preview Wall */}
          <PreviewWall videos={allVideos} />

          {/* Performer Worlds */}
          <PerformerWorldsGrid performers={allPerformers} />

          {/* Studio Journal */}
          <StudioJournalPreview articles={allArticles} />

          {/* Join the Vault */}
          <JoinTheVault />

          {/* Footer */}
          <StudioFooter />
        </div>
      </div>
    </>
  );
}