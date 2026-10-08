import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

export default function InternalLinkCard({ href, title, desc }) {
  return (
    <Link
      to={href}
      className="bg-[#111] border border-white/8 rounded-xl p-5 hover:border-rose-600/40 hover:bg-rose-600/5 transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-sm group-hover:text-rose-400 transition-colors">{title}</h3>
        <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-rose-400 transition-colors" />
      </div>
      <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
    </Link>
  );
}