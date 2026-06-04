/**
 * FanclubSupportBlock
 *
 * "Support Your Favorite Performer" conversion block.
 * Used on PerformerDetail pages (and optionally homepage).
 *
 * Props:
 *   performerName  — string, performer display name
 *   isAuthenticated — bool
 *   onJoin         — () => void — called when CTA clicked
 *   performers     — array of performer objects with profile_image_url (for visual row)
 */
import { Link } from "react-router-dom";
import { Crown, Check, Play, Star, Zap, Film, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  { icon: Film,  text: "More of your favorite performers" },
  { icon: Crown, text: "Exclusive member-only scenes" },
  { icon: Zap,   text: "Early access before public release" },
  { icon: Star,  text: "Bonus clips not shown on the public side" },
  { icon: Eye,   text: "Behind-the-scenes production moments" },
  { icon: Crown, text: "Performer updates and new drops" },
  { icon: Film,  text: "Selected exclusive Fanclub releases" },
  { icon: Check, text: "Better value than buying multiple PPVs" },
];

export default function FanclubSupportBlock({ performerName, isAuthenticated, onJoin, performers = [] }) {
  // Show up to 6 performers with images as a visual row
  const visualPerformers = performers.filter(p => p.profile_image_url).slice(0, 6);

  return (
    <div className="relative bg-gradient-to-br from-rose-950/50 via-[#110808] to-[#0d0d0d] border border-rose-600/30 rounded-3xl overflow-hidden">
      {/* ambient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative p-8 lg:p-12">
        {/* Performer image row */}
        {visualPerformers.length > 0 && (
          <div className="flex gap-2 mb-8">
            {visualPerformers.map((p, i) => (
              <div key={i} className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#0d0d0d]" style={{ marginLeft: i > 0 ? "-8px" : "0" }}>
                  <img src={p.profile_image_url} alt={p.display_name} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
            {visualPerformers.length > 0 && (
              <div className="ml-2 flex items-center">
                <span className="text-white/40 text-xs">+{visualPerformers.length} more performers</span>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/25 rounded-full px-3 py-1 mb-5">
              <Crown className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 text-xs font-bold tracking-wide uppercase">Support the Performers</span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              {performerName
                ? <>WANT TO SEE MORE<br />OF <span className="text-rose-500">{performerName.toUpperCase()}</span>?</>
                : <>SUPPORT YOUR<br /><span className="text-rose-500">FAVORITE PERFORMERS</span></>
              }
            </h2>

            <p className="text-white/55 text-base leading-relaxed mb-6">
              {performerName
                ? `Join Fanclub to unlock member-only content, early releases, bonus clips and updates from ${performerName} and all FLESHLAB performers.`
                : "Like what you see? Join Fanclub to unlock member-only content and support the performers you want to see more of."
              }
            </p>

            <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-md">
              Found one of our guys you want to see more of? Your membership helps FLESHLAB keep producing, promoting and building performer brands — while you unlock the member side of the platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onJoin}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-xl h-auto shadow-lg shadow-rose-600/30"
              >
                <Crown className="w-4 h-4 mr-2" />
                {isAuthenticated ? "Enter Fanclub — $12.99/month" : "Join Fanclub — $12.99/month"}
              </Button>
              <Link to="/performers">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/8 px-6 py-4 rounded-xl h-auto font-semibold">
                  <Play className="w-4 h-4 mr-2" />
                  Browse Performers
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — benefit grid */}
          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-white/4 border border-white/6 rounded-xl p-3.5">
                <div className="w-7 h-7 rounded-lg bg-rose-600/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-white/60 text-xs leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}