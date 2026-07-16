import MediaImage from "@/components/homeTube/MediaImage";
import KrakenSectionTitle from "./KrakenSectionTitle";

export default function StudioNotes({ articles = [] }) {
  const notes = articles.slice(0, 3);
  if (!notes.length) return null;

  return (
    <section className="border-t border-white/10 px-5 py-20 text-white md:px-10 md:py-28 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <KrakenSectionTitle eyebrow="Studio notes" title="Behind the releases." copy="Short updates, production context and FLESHLAB search content." />
        <div className="grid gap-5 md:grid-cols-3">
          {notes.map((article) => (
            <a key={article.id || article.slug} href={article.slug ? `/news/${article.slug}` : "/news"} className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#101010] transition duration-500 hover:-translate-y-1 hover:border-[#E51D2A]/45">
              <div className="aspect-[16/9] overflow-hidden bg-black"><MediaImage src={article.cover_image_url} alt={article.title} className="h-full w-full opacity-75 transition duration-700 group-hover:scale-[1.05]" /></div>
              <div className="p-6"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#E51D2A]">Read</p><h3 className="mt-3 text-3xl font-black uppercase leading-[0.88] tracking-[-0.055em]">{article.title}</h3></div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}