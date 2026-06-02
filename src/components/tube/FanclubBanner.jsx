import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function FanclubBanner() {
  return (
    <section className="py-12 bg-gradient-to-b from-[#0a0a0a] via-rose-950/20 to-[#0a0a0a]">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Unlock the Full FLESHLAB Archive
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Public trailers are free. Full scenes require Fanclub, PPV, or membership access.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/fanclub">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-8">
                Join Fanclub
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                Create Free Account
              </Button>
            </Link>
            <Link to="/videos">
              <Button size="lg" variant="ghost" className="text-rose-500 hover:text-rose-400">
                Browse Previews
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}