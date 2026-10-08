import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Clapperboard, MapPin, Sparkles } from "lucide-react";
import MediaImage from "@/components/homeTube/MediaImage";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

const fallbackImages = [
  "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a3babcb65_generated_image.png",
  "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/96230e13e_generated_image.png",
  "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b2a370cb_generated_image.png",
  "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ee7e890ef_generated_image.png",
  "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d35df4180_generated_image.png",
];

const fallbackCreators = [
  { id: "fitmaster", display_name: "THEFITMASTER", nationality: "Philippines", slug: "thefitmaster", video_count: 4, created_date: "2026-01-08", production_note: "Hotel Sessions", story_status: "Preparing Episode 5", creator_tag: "Trending creator" },
  { id: "kraken", display_name: "KRAKEN", nationality: "Taiwan", slug: "kraken", video_count: 0, created_date: "2026-05-16", production_note: "First Series", story_status: "Building first release", creator_tag: "New creator" },
  { id: "motel", display_name: "MOTEL BOY", nationality: "Thailand", slug: "motel-boy", video_count: 2, created_date: "2026-03-22", production_note: "Travel Room", story_status: "Recently joined", creator_tag: "Behind the scenes" },
  { id: "nightshift", display_name: "NIGHTSHIFT", nationality: "Taiwan", slug: "nightshift", video_count: 3, created_date: "2025-11-12", production_note: "After Hours", story_status: "New production world", creator_tag: "Independent production" },
];

const worlds = ["Hotel Sessions", "Gym Diaries", "Travel Room", "First Series", "Behind the Scenes", "After Hours"];
const tags = ["Preparing Episode 5", "Recently joined", "Building first series", "First hotel shoot", "Trending creator", "New production world"];
const positions = ["object-[center_24%]", "object-[58%_34%]", "object-[42%_38%]", "object-[center_48%]"];

function hash(value = "") {
  return String(value).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function yearJoined(creator) {
  const date = new Date(creator.created_date || creator.created_at || "2026-01-01");
  return Number.isFinite(date.getFullYear()) ? date.getFullYear() : 2026;
}

function storyFor(creator, index) {
  const key = hash(creator.slug || creator.display_name || index);
  const videoCount = Number(creator.video_count || 0);
  return {
    name: creator.display_name || creator.name || "FLESHLAB Creator",
    country: creator.nationality || creator.country || ["Philippines", "Taiwan", "Thailand", "Japan"][index % 4],
    joined: videoCount ? `Joined ${yearJoined(creator)}` : "New Creator",
    status: creator.story_status || tags[key % tags.length],
    series: creator.production_note || worlds[key % worlds.length],
    episode: videoCount > 0 ? `Episode ${Math.min(videoCount + 1, 9)}` : "First release in progress",
    tag: creator.creator_tag || (videoCount > 2 ? "Creator momentum" : "Real story forming"),
    image: buildPublicAssetUrl((index % 2 === 0 ? creator.cover_image_url || creator.profile_image_url : creator.profile_image_url || creator.cover_image_url)) || fallbackImages[index % fallbackImages.length],
    href: creator.slug ? `/performers/${creator.slug}` : "/performers",
    verified: creator.verified,
  };
}

function CreatorCard({ creator, index, featured = false }) {
  const story = storyFor(creator, index);
  return (
    <motion.a
      href={story.href}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: 0.62, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative block overflow-hidden rounded-[1.6rem] border border-white/12 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.34)] transition duration-500 hover:-translate-y-1 hover:border-[#f0183d]/65 hover:shadow-[0_34px_120px_rgba(240,24,61,0.22)] ${featured ? "min-h-[620px] lg:col-span-2 lg:row-span-2" : "min-h-[300px] md:min-h-[360px]"}`}
    >
      <MediaImage src={story.image} alt={story.name} className={`absolute inset-0 h-full w-full object-cover ${positions[index % positions.length]} opacity-86 transition duration-[1200ms] group-hover:scale-110 group-hover:opacity-100`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/28 to-black/4" />
      <div className="absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_76%,rgba(240,24,61,0.38),transparent_34%)]" />
      <div className="absolute left-5 top-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-black">{story.status}</span>
        {story.verified && <span className="inline-flex items-center gap-1 rounded-full bg-[#f0183d] px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-white"><BadgeCheck className="h-3 w-3" /> Verified</span>}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <div className="transition duration-500 group-hover:-translate-y-3">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/62"><MapPin className="h-3.5 w-3.5 text-[#f0183d]" /> {story.country}</p>
          <h3 className={`fl-condensed uppercase leading-none tracking-[-0.02em] text-white ${featured ? "text-[72px] md:text-[104px]" : "text-[46px] md:text-[58px]"}`}>{story.name}</h3>
          <div className="mt-4 grid gap-2 text-[10px] font-black uppercase tracking-wide text-white/72 sm:grid-cols-2">
            <span>{story.joined}</span>
            <span className="text-[#f0183d]">{story.series}</span>
            <span>{story.episode}</span>
            <span>{story.tag}</span>
          </div>
        </div>
        <div className="mt-5 flex translate-y-4 items-center justify-between gap-4 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="max-w-sm text-sm leading-6 text-white/62">A real creator in motion — not a category, not a stock fantasy.</p>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#f0183d] px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white">View Creator <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </motion.a>
  );
}

export default function CreatorStoriesSection({ performers = [] }) {
  const creators = (performers.length ? performers : fallbackCreators).slice(0, 4);
  return (
    <section id="creator-stories" className="relative overflow-hidden border-y border-white/8 bg-[#05090c] px-5 py-20 lg:px-7 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(240,24,61,0.18),transparent_32%),radial-gradient(circle_at_78%_72%,rgba(255,255,255,0.07),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1360px]">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.85fr_1fr] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">CREATOR STORIES</p>
            <h2 className="fl-condensed mt-3 text-[64px] uppercase leading-[0.9] tracking-[-0.025em] text-white md:text-[92px]">REAL PEOPLE.<br />REAL DESIRE.</h2>
          </div>
          <div className="max-w-2xl lg:justify-self-end">
            <p className="text-lg font-semibold leading-8 text-white/72">Meet the creators behind authentic amateur productions. Every creator has a story. Every production starts with a real person.</p>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.28em] text-white/42">AMATEUR WINS. BUILT AROUND REAL CREATORS.</p>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-4 lg:auto-rows-[300px]">
          {creators.map((creator, index) => <CreatorCard key={creator.id || creator.slug || index} creator={creator} index={index} featured={index === 0} />)}
        </div>
      </div>
    </section>
  );
}