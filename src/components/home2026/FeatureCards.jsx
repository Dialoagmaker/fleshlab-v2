import { Link } from "react-router-dom";
import { Film, Search, Star } from "lucide-react";

const cards = [
  {
    title: "Watch Videos",
    text: "Browse cinematic amateur productions from verified real people.",
    href: "/videos",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
    Icon: Film,
  },
  {
    title: "Become Performer",
    text: "Create authentic homemade productions and earn with the studio.",
    href: "/become-performer",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    Icon: Star,
  },
  {
    title: "Explore Categories",
    text: "Find solo, couples, massage, homemade and behind-the-scenes releases.",
    href: "/videos",
    image: "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1200&q=80",
    Icon: Search,
  },
];

export default function FeatureCards() {
  return (
    <section className="bg-[#070707] px-6 md:px-10 lg:px-16 py-24 md:py-32">
      <div className="max-w-[1600px] mx-auto grid md:grid-cols-3 gap-6">
        {cards.map(({ title, text, href, image, Icon }) => (
          <Link key={title} to={href} className="group block rounded-[24px] overflow-hidden bg-[#1A1A1A] border border-white/[0.08] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/60">
            <div className="aspect-[4/3] overflow-hidden bg-[#121212]">
              <img src={image} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="p-6 md:p-8">
              <Icon className="w-7 h-7 text-[#D81F26] mb-5" />
              <h3 className="text-white text-[22px] font-black uppercase tracking-tight mb-3">{title}</h3>
              <p className="text-[#B0B0B0] text-base leading-relaxed">{text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}