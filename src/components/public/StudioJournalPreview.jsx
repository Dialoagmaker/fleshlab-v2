import { Link } from "react-router-dom";
import { isPublicImageUrl } from "@/lib/seoValidation";

/**
 * StudioJournalPreview - Editorial news module (1 lead + 2 secondary)
 */
export default function StudioJournalPreview({ articles = [] }) {
  // Take first 3 articles
  const featuredArticles = articles.slice(0, 3);

  if (featuredArticles.length === 0) {
    return (
      <section className="py-16 px-4 bg-[#0F0F0F] border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Studio Journal</h2>
          <p className="text-[#F5F5F5]/60 mb-8">From the archive</p>
          <div className="text-center py-20 bg-[#0A0A0A] rounded-xl border border-white/[0.05]">
            <p className="text-[#F5F5F5]/40">No articles available</p>
          </div>
        </div>
      </section>
    );
  }

  const leadArticle = featuredArticles[0];
  const secondaryArticles = featuredArticles.slice(1, 3);

  return (
    <section className="py-16 px-4 bg-[#0F0F0F] border-y border-white/[0.05]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Studio Journal</h2>
          <p className="text-[#F5F5F5]/60">From the archive</p>
        </div>

        {/* Lead article (large editorial spread) */}
        {leadArticle && (
          <div className="mb-8">
            <ArticleCard article={leadArticle} variant="lead" />
          </div>
        )}

        {/* Secondary articles (2-column on desktop) */}
        {secondaryArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondaryArticles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="secondary" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ArticleCard({ article, variant = "secondary" }) {
  const hasValidImage = isPublicImageUrl(article.cover_image_url);

  if (variant === "lead") {
    return (
      <Link
        to={`/news/${article.slug}`}
        className="group block relative rounded-lg overflow-hidden bg-[#0A0A0A] border border-white/[0.05] hover:border-rose-600/30 transition-all"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-video md:aspect-auto">
            {hasValidImage ? (
              <img
                src={article.cover_image_url}
                alt={article.title}
                loading="eager"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-rose-500 transition-colors">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="text-[#F5F5F5]/60 mb-6 line-clamp-3">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center gap-2 text-rose-500 font-medium group-hover:text-rose-400 transition-colors">
              <span>Read Feature</span>
              <span className="text-lg">→</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Secondary variant
  return (
    <Link
      to={`/news/${article.slug}`}
      className="group block rounded-lg overflow-hidden bg-[#0A0A0A] border border-white/[0.05] hover:border-rose-600/30 transition-all"
    >
      {/* Image */}
      <div className="aspect-video">
        {hasValidImage ? (
          <img
            src={article.cover_image_url}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rose-500 transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-[#F5F5F5]/60 mb-4 line-clamp-2">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-rose-500 font-medium text-sm group-hover:text-rose-400 transition-colors">
          <span>Read</span>
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}