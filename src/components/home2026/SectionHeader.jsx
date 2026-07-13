import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function SectionHeader({ eyebrow, title, text, link, linkLabel = "View All" }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-10">
      <div className="max-w-3xl">
        {eyebrow && <p className="text-[#D81F26] text-sm font-black uppercase tracking-[0.3em] mb-4">{eyebrow}</p>}
        <h2 className="text-white text-4xl md:text-5xl font-black uppercase tracking-[-0.05em] leading-none">{title}</h2>
        {text && <p className="text-[#B0B0B0] text-lg leading-relaxed mt-4">{text}</p>}
      </div>
      {link && (
        <Link to={link} className="text-white text-base font-black inline-flex items-center gap-2 hover:text-[#D81F26] transition-colors duration-200">
          {linkLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}