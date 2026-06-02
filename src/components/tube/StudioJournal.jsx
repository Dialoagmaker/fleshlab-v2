import { useI18n } from "@/i18n/i18n.jsx";
import { ArrowRight, Newspaper } from "lucide-react";

export default function StudioJournal({ articles = [] }) {
  const { t } = useI18n();

  // Hide section if no articles (don't show empty block)
  if (articles.length === 0) return null;

  return (
    <section className="py-12 bg-[#0a0a0a] border-t border-white/5">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* Red accent line */}
            <div className="w-1.5 h-8 bg-gradient-to-b from-rose-600 to-rose-700 rounded-full shadow-lg shadow-rose-600/40" />
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                <span className="text-rose-500">STUDIO</span> JOURNAL
              </h2>
              <p className="text-xs text-white/50 mt-1">
                News, creator updates and FLESHLAB stories.
              </p>
            </div>
          </div>
          <a href="/news" className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
            View All News <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((article) => (
            <a
              key={article.id}
              href={`/news/${article.slug}`}
              className="group block bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:shadow-lg hover:shadow-rose-900/10"
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] relative overflow-hidden">
                {article.cover_image_url ? (
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-900/40 to-[#1a1a1a] flex items-center justify-center">
                    <Newspaper className="w-12 h-12 text-white/10" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-white group-hover:text-rose-500 transition-colors line-clamp-2 mb-2 leading-tight">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-white/60 line-clamp-2 mb-4 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}
                <span className="text-sm text-rose-500 font-semibold group-hover:text-rose-400 transition-colors flex items-center gap-1">
                  Read Article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}