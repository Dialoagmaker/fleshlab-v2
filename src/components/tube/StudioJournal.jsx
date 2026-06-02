import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function StudioJournal({ articles = [] }) {
  if (articles.length === 0) return null;

  return (
    <section className="py-8 bg-[#0a0a0a]">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Latest from the Studio</h2>
          <Link to="/news" className="text-sm text-rose-500 hover:text-rose-400 font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.slice(0, 3).map((article) => (
            <Link
              key={article.id}
              to={`/news/${article.slug}`}
              className="group block bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
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
                  <div className="w-full h-full bg-gradient-to-br from-rose-900/40 to-[#1a1a1a]" />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-base font-semibold text-white group-hover:text-rose-500 transition-colors line-clamp-2 mb-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-white/60 line-clamp-2 mb-3">
                    {article.excerpt}
                  </p>
                )}
                <span className="text-sm text-rose-500 font-medium group-hover:text-rose-400 transition-colors">
                  Read More →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}