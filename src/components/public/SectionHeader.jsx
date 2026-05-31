import { ArrowRight } from "lucide-react";

export default function SectionHeader({ title, subtitle, viewAllLink, viewAllText = "View All" }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {viewAllLink && (
        <a
          href={viewAllLink}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {viewAllText}
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}