import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WA_LINK = `https://wa.me/886958679186?text=${encodeURIComponent("Hi FLESHLAB Management, I need help with my account or Fan Production request.")}`;

export default function MessagesTab() {
  return (
    <div className="space-y-5">
      <h2 className="font-black text-white text-base flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-rose-400" />
        Messages
      </h2>

      <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
        <MessageCircle className="w-10 h-10 text-white/15 mx-auto mb-3" />
        <h3 className="text-white/60 font-semibold mb-1">No messages yet</h3>
        <p className="text-white/30 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          Studio updates, quote notifications and support replies will appear here.
        </p>
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="border-white/15 text-white/65 hover:bg-white/8 hover:text-white gap-2 font-bold px-6 py-2.5 rounded-xl h-auto text-sm">
            <MessageCircle className="w-4 h-4" />
            Contact Management on WhatsApp
          </Button>
        </a>
      </div>

      <div className="bg-white/3 border border-white/6 rounded-xl p-4 text-white/25 text-xs leading-relaxed">
        For urgent questions, contact FLESHLAB Management directly on WhatsApp. In-app messaging will be available in a future update.
      </div>
    </div>
  );
}