import { BarChart2, PlayCircle, Crown, Video, Users, Unlock } from "lucide-react";

const INCOME_SOURCES = [
  {
    Icon: BarChart2,
    title: "View Share on Partner Platforms",
    desc: "Your scenes can be published on selected partner platforms. When your videos generate views and revenue, you receive your share.",
    badge: "Passive",
    color: "rose",
  },
  {
    Icon: PlayCircle,
    title: "Video Sales — FLESHLAB & FapHouse",
    desc: "Selected scenes can be sold as PPV, premium content or platform video sales. Each sale contributes to your monthly earnings.",
    badge: "Per sale",
    color: "amber",
  },
  {
    Icon: Crown,
    title: "Performer Fanclub Subscriptions",
    desc: "Fans who want more of you subscribe to your personal performer fanclub. Revenue is shared according to your model.",
    badge: "Recurring",
    color: "purple",
  },
  {
    Icon: Video,
    title: "Livecam Tokens",
    desc: "Livecam shows generate additional income through tokens. They also help build regular viewers and push your fanbase.",
    badge: "Active",
    color: "blue",
  },
  {
    Icon: Users,
    title: "Collaborations with Other Performers",
    desc: "Partner productions create more sexual variety, stronger thumbnails, more fan overlap and higher viewer interest than solo content alone.",
    badge: "Multiplier",
    color: "orange",
  },
  {
    Icon: Unlock,
    title: "PPV / Premium Unlocks",
    desc: "Some content can be locked behind paid access. Fans pay to unlock selected scenes or premium content.",
    badge: "High value",
    color: "emerald",
  },
];

const colorMap = {
  rose:    { badge: "border-rose-600/30 bg-rose-600/8 text-rose-400",    icon: "text-rose-500" },
  amber:   { badge: "border-amber-500/30 bg-amber-500/8 text-amber-400", icon: "text-amber-500" },
  purple:  { badge: "border-purple-600/30 bg-purple-600/8 text-purple-400", icon: "text-purple-400" },
  blue:    { badge: "border-blue-500/30 bg-blue-500/8 text-blue-400",    icon: "text-blue-400" },
  orange:  { badge: "border-orange-500/30 bg-orange-500/8 text-orange-400", icon: "text-orange-400" },
  emerald: { badge: "border-emerald-500/30 bg-emerald-500/8 text-emerald-400", icon: "text-emerald-400" },
};

export default function BPEarnSection() {
  return (
    <section id="how-you-earn" className="py-24 px-6 bg-gradient-to-b from-[#080808] to-[#0d0505]">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
            HOW YOU EARN MONEY<br />
            <span className="text-rose-500">WITH FLESHLAB</span>
          </h2>
          <p className="text-white/55 text-lg leading-relaxed mb-3">
            Produce content. Collaborate with other performers. Build your fanbase. Push your sales with livecam shows and fanclub subscriptions.
          </p>
          <p className="text-rose-400/80 font-semibold text-base">
            You can start earning from the first video we produce and publish with you.
          </p>
          <p className="text-white/40 text-sm mt-1 leading-relaxed">
            From your first published FLESHLAB video, your content can start generating views, sales, fanclub interest and platform revenue. Your first scene is not just a test — it is your first chance to earn.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INCOME_SOURCES.map(({ Icon, title, desc, badge, color }, i) => (
            <div key={i} className="bg-[#111] border border-white/8 rounded-2xl p-6 flex flex-col gap-3 hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0 ${colorMap[color].icon}`}>
                  <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest border rounded-full px-2.5 py-0.5 ${colorMap[color].badge}`}>
                  {badge}
                </span>
              </div>
              <div className="font-bold text-white text-base leading-snug">{title}</div>
              <div className="text-white/45 text-sm leading-relaxed flex-1">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}