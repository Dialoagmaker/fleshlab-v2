import { ArrowRight } from "lucide-react";
import RecruitmentHero from "@/components/homeRecruitment/RecruitmentHero";
import RecruitmentSection from "@/components/homeRecruitment/RecruitmentSection";
import CreatorProof from "@/components/homeRecruitment/CreatorProof";
import RecruitmentJourney from "@/components/homeRecruitment/RecruitmentJourney";
import SecondaryContent from "@/components/homeRecruitment/SecondaryContent";

export default function HomeTubePage({ videos = [], totalVideoCount, performers = [], articles = [] }) {
  const featured = videos.find((video) => video.featured) || videos[0];

  return (
    <div className="bg-[#050505] text-white">
      <RecruitmentHero video={featured} performerCount={performers.length} />

      <RecruitmentSection
        eyebrow="Who are you?"
        title="An amateur studio for people who are still figuring it out."
        intro="FLESHLAB is not built around perfect porn stars. It is built around real creators who start with curiosity, nerves and the hope that one brave step can open a new door."
      >
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <p className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.055em] text-white md:text-5xl">AMATEUR WINS means the first version of you is already enough to begin.</p>
          <div className="space-y-5 text-lg leading-relaxed text-white/66">
            <p>You may want a better phone. You may want rent money. You may want to help at home, feel wanted, or prove to yourself that your body has value.</p>
            <p>The homepage is now built for that person first: the future creator asking, “Can someone like me really do this?”</p>
          </div>
        </div>
      </RecruitmentSection>

      <CreatorProof performers={performers} videos={videos} />
      <RecruitmentJourney videos={videos} />

      <RecruitmentSection eyebrow="Apply now" title="If you are curious, start with a private application." intro="You do not need to be ready for a shoot today. The first step is simply telling us who you are, what you are comfortable with and what kind of future you want.">
        <div className="relative overflow-hidden rounded-[42px] border border-[#E51D2A]/35 bg-[#100607] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.55)] md:p-12">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_45%,rgba(229,29,42,0.22),transparent_38%)]" />
          <div className="relative max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Private · Verified 18+ · Human review</p>
            <h2 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-white md:text-7xl">Everybody starts somewhere.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/66">Tell us your story. Ask your nervous questions. If it is not right for you, that is okay. If it is, we will explain the next step clearly.</p>
            <a href="/become-performer" className="mt-9 inline-flex h-14 items-center gap-3 rounded-full bg-[#E51D2A] px-8 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#c91822]">Become a performer <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </RecruitmentSection>

      <SecondaryContent videos={videos} performers={performers} articles={articles} totalVideoCount={totalVideoCount} />
    </div>
  );
}