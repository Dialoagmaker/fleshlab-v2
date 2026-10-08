import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function SectionHeader({ eyebrow, title, text, link, linkLabel = "View All" }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
      <div className="max-w-3xl">
        {eyebrow && <p className="text-[#E51D2A] text-xs md:text-sm font-black uppercase tracking-[0.3em] mb-3">{eyebrow}</p>}
        <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-[-0.04em] leading-none">{title}</h2>
        {text && <p className="text-[#B7B7B7] text-base md:text-lg leading-relaxed mt-3">{text}</p>}
      </div>
      {link && (
        <Link to={link} className="text-white text-sm md:text-base font-bold inline-flex items-center gap-2 hover:text-[#E51D2A] transition-colors duration-200 whitespace-nowrap">
          {linkLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}