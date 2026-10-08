import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function SectionHeader({ title, subtitle, viewAllLink, viewAllText = "View All", accent = false }) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div>
        {accent && (
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-8 bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">{accent}</span>
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-white/45 text-sm mt-1.5">{subtitle}</p>
        )}
      </div>
      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="shrink-0 flex items-center gap-1.5 text-sm text-primary/80 hover:text-primary font-semibold transition-colors"
        >
          {viewAllText}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}