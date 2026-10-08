import { Video, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VideosTab() {
  return (
    <div className="space-y-5">
      <h2 className="font-black text-white text-base flex items-center gap-2">
        <Video className="w-4 h-4 text-rose-400" />
        My Videos
      </h2>

      <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Video className="w-7 h-7 text-white/20" />
        </div>
        <h3 className="text-white font-black text-lg mb-2">No purchased videos yet</h3>
        <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          You have not unlocked any videos yet. Browse the video library to find content you want to purchase.
        </p>
        <Button
          onClick={() => window.location.href = "/videos"}
          variant="outline"
          className="border-white/15 text-white/65 hover:bg-white/8 hover:text-white gap-2 font-bold px-6 py-2.5 rounded-xl h-auto"
        >
          Browse Videos
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white/3 border border-white/6 rounded-xl p-4 text-white/30 text-xs leading-relaxed">
        Video purchase history and PPV unlock records will appear here once you have made purchases.
        Purchases are handled securely through the FLESHLAB checkout.
      </div>
    </div>
  );
}