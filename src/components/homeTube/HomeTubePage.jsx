import DocumentaryHero from "@/components/homeDocumentary/DocumentaryHero";
import DocumentaryRail from "@/components/homeDocumentary/DocumentaryRail";
import DocumentaryMosaic from "@/components/homeDocumentary/DocumentaryMosaic";
import DocumentaryArchive from "@/components/homeDocumentary/DocumentaryArchive";
import StoryPoster from "@/components/homeDocumentary/StoryPoster";

export default function HomeTubePage({ videos = [], performers = [], articles = [] }) {
  const featured = videos.find((video) => video.featured) || videos[0];

  return (
    <div className="bg-[#050505] text-white">
      <DocumentaryHero video={featured} />
      <DocumentaryRail videos={videos} performers={performers} />
      <DocumentaryMosaic videos={videos} performers={performers} />

      <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 lg:px-14">
        <div className="grid gap-5 lg:grid-cols-3">
          <StoryPoster title="AFTER MIDNIGHT" label="Night chapter" video={videos[6]} image={performers[4]?.cover_image_url} href="/videos" />
          <StoryPoster title="THE FIRST PAYOUT" label="Amateur wins" video={videos[7]} image={performers[5]?.profile_image_url} href="/become-performer" tall />
          <StoryPoster title="WHY I CAME BACK" label="Creator story" video={videos[8]} image={performers[6]?.cover_image_url} href="/become-performer" />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 lg:px-14">
        <a href="/become-performer" className="group relative block min-h-[560px] overflow-hidden rounded-[42px] border border-[#E51D2A]/40 bg-[#120708]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(229,29,42,0.28),transparent_34%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-0 p-8 md:p-12">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">Open casting</p>
            <h2 className="max-w-4xl text-7xl font-black uppercase leading-[0.78] tracking-[-0.085em] text-white md:text-9xl">YOUR FIRST SCENE</h2>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-white/58">Private application · verified 18+ · human review</p>
          </div>
        </a>
      </section>

      <DocumentaryArchive videos={videos} performers={performers} articles={articles} />
    </div>
  );
}