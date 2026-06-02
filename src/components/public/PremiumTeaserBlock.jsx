import { Play, Star, Users, Crown, ArrowRight, Sparkles, Film } from "lucide-react";
import { Link } from "react-router-dom";

const bullets = [
  { icon: Film,     label: "Exclusive scenes" },
  { icon: Play,     label: "Early releases" },
  { icon: Star,     label: "Behind the scenes" },
  { icon: Users,    label: "Performer updates" },
];

export default function PremiumTeaserBlock({ title = "Unlock the Full FLESHLAB Experience" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-black" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <Crown className="w-8 h-8 text-primary" />
          </div>

          <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            {title}
          </h3>
          <p className="text-white/55 text-base md:text-lg mb-8 leading-relaxed">
            Get early access, exclusive scenes, behind-the-scenes updates, and direct studio support.
          </p>

          {/* Bullets */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8">
            {bullets.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white/60">
                <Icon className="w-4 h-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <Link
            to="/fanclub"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-primary/30 text-base"
          >
            <Crown className="w-5 h-5" />
            Join Fanclub
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}