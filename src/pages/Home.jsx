import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import VideoCard from "@/components/public/VideoCard";
import PerformerCard from "@/components/public/PerformerCard";
import NewsCard from "@/components/public/NewsCard";
import { Button } from "@/components/ui/button";
import { Play, Users, Newspaper, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  // Fetch videos
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['public-videos-fn'],
    queryFn: () => callPublicFunction('getPublicVideos'),
    retry: 0,
    staleTime: 30000,
  });
  const videos = videosData?.videos || [];

  // Fetch performers
  const { data: performersData, isLoading: performersLoading } = useQuery({
    queryKey: ['public-performers-fn'],
    queryFn: () => callPublicFunction('getPublicPerformers'),
    retry: 0,
    staleTime: 30000,
  });
  const performers = performersData?.performers || [];

  // Fetch news
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['public-news-fn'],
    queryFn: () => callPublicFunction('getPublicNews'),
    retry: 0,
    staleTime: 30000,
  });
  const articles = newsData?.articles || [];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get featured videos (prioritize featured, then recent)
  const featuredVideos = videos.length > 0 
    ? videos.filter(v => v.featured).length > 0 
      ? videos.filter(v => v.featured).slice(0, 8)
      : videos.slice(0, 8)
    : [];

  // Get featured performers
  const featuredPerformers = performers.length > 0
    ? performers.filter(p => p.featured).length > 0
      ? performers.filter(p => p.featured).slice(0, 8)
      : performers.slice(0, 8)
    : [];

  return (
    <>
      <SEOMeta
        title="FLESHLAB — Premium Asian Gay Adult Studio"
        description="FLESHLAB is a premium gay adult studio featuring verified Asian performers, exclusive productions, and member-only content."
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
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden border-b border-white/[0.05]">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-rose-900/15 via-[#0A0A0A]/90 to-[#0A0A0A]" />
          {videos.length > 0 && videos[0].cover_image_url && (
            <img
              src={videos[0].cover_image_url}
              alt="Featured content"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
              loading="eager"
            />
          )}
          
          {/* Hero Content */}
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
              FLESHLAB
            </h1>
            <p className="text-lg md:text-xl text-[#F5F5F5]/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Premium Asian Gay Adult Studio
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/videos">
                <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-8 h-12">
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Browse Videos
                </Button>
              </Link>
              <Link to="/performers">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 h-12">
                  <Users className="w-5 h-5 mr-2" />
                  Meet Performers
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Latest Videos Section */}
        <section className="py-20 px-4 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Latest Releases</h2>
                <p className="text-[#F5F5F5]/60">New productions weekly</p>
              </div>
              <Link to="/videos">
                <Button variant="ghost" className="text-rose-500 hover:text-rose-400 hidden sm:flex">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {videosLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-video bg-[#111] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : featuredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredVideos.map(video => (
                  <VideoCard key={video.id} video={video} brands={videosData?.brands || []} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#0F0F0F] rounded-xl border border-white/[0.05]">
                <Play className="w-12 h-12 mx-auto mb-4 text-[#F5F5F5]/30" />
                <p className="text-[#F5F5F5]/60 mb-4">Videos coming soon</p>
                <Link to="/videos">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Browse All Videos
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="mt-8 text-center sm:hidden">
              <Link to="/videos">
                <Button variant="ghost" className="text-rose-500 hover:text-rose-400">
                  View All Videos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Performers Section */}
        <section className="py-20 px-4 bg-[#0F0F0F] border-y border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Featured Performers</h2>
                <p className="text-[#F5F5F5]/60">Verified Asian talent</p>
              </div>
              <Link to="/performers">
                <Button variant="ghost" className="text-rose-500 hover:text-rose-400 hidden sm:flex">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {performersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-[#111] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : featuredPerformers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredPerformers.map(performer => (
                  <PerformerCard key={performer.id} performer={performer} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#141414] rounded-xl border border-white/[0.05]">
                <Users className="w-12 h-12 mx-auto mb-4 text-[#F5F5F5]/30" />
                <p className="text-[#F5F5F5]/60 mb-4">Performers coming soon</p>
                <Link to="/performers">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Browse All Performers
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="mt-8 text-center sm:hidden">
              <Link to="/performers">
                <Button variant="ghost" className="text-rose-500 hover:text-rose-400">
                  View All Performers <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Studio Journal Section */}
        <section className="py-20 px-4 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Studio Journal</h2>
                <p className="text-[#F5F5F5]/60">News and behind-the-scenes</p>
              </div>
              <Link to="/news">
                <Button variant="ghost" className="text-rose-500 hover:text-rose-400 hidden sm:flex">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {newsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-[#111] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(0, 3).map(article => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#0F0F0F] rounded-xl border border-white/[0.05]">
                <Newspaper className="w-12 h-12 mx-auto mb-4 text-[#F5F5F5]/30" />
                <p className="text-[#F5F5F5]/60 mb-4">Stories coming soon</p>
                <Link to="/news">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Browse All Articles
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="mt-8 text-center sm:hidden">
              <Link to="/news">
                <Button variant="ghost" className="text-rose-500 hover:text-rose-400">
                  View All Articles <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Membership CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-[#0A0A0A] via-rose-950/10 to-[#0A0A0A] border-t border-white/[0.05]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join the Vault
            </h2>
            <p className="text-xl text-[#F5F5F5]/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Access exclusive content, behind-the-scenes footage, and member-only productions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-8 h-12">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 h-12">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}