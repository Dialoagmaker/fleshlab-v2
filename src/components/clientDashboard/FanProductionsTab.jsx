import { Film, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestCard from "@/components/dashboard/RequestCard";

export default function FanProductionsTab({ requests, loading }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-white text-base flex items-center gap-2">
          <Film className="w-4 h-4 text-rose-400" />
          Fan Production Requests
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-white/25 text-xs">{requests.length} total</span>
          <Button
            size="sm"
            onClick={() => window.location.href = "/fan-productions/request"}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg h-8 px-4 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Request
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
          <div className="w-6 h-6 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center mx-auto mb-4">
            <Film className="w-7 h-7 text-rose-400/50" />
          </div>
          <h3 className="text-white font-black text-lg mb-2">No Fan Production requests yet</h3>
          <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            Ready to become part of an official FLESHLAB homemade-style production?
          </p>
          <Button
            onClick={() => window.location.href = "/fan-productions/request"}
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 py-3 rounded-xl h-auto gap-2"
          >
            Build Your Fan Production Request
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((req) => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}