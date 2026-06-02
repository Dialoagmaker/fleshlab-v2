import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Star } from "lucide-react";

export default function FanclubBanner() {
  return (
    <section className="py-8 bg-gradient-to-r from-rose-950/30 via-[#0a0a0a] to-rose-950/30 border-y border-white/5">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-900/40 to-[#0a0a0a] border border-rose-600/20 p-6 md:p-8">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Lock className="w-6 h-6 text-rose-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Unlock the Full FLESHLAB Archive
              </h2>
            </div>
            <p className="text-white/70 mb-6 max-w-2xl mx-auto">
              Watch public previews free. Full scenes require Fanclub, PPV, or membership access.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/fanclub">
                <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6">
                  <Star className="w-4 h-4 mr-2 fill-current" />
                  Join Fanclub
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-6">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/videos">
                <Button size="lg" variant="ghost" className="text-rose-500 hover:text-rose-400 font-semibold px-6">
                  Browse Previews
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}