import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";

const categories = [
  { title: "Asian Twinks", count: "24+ videos", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" },
  { title: "Solo", count: "18+ videos", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80" },
  { title: "Couples", count: "12+ videos", image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80" },
  { title: "Massage", count: "9+ videos", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80" },
  { title: "Homemade", count: "30+ videos", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80" },
  { title: "Behind the Scenes", count: "8+ videos", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80" },
];

export default function CategoryGrid() {
  return (
    <section className="bg-[#070707] px-6 md:px-10 lg:px-16 py-24 md:py-32">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeader eyebrow="Explore" title="Categories" text="A cleaner way to discover authentic homemade productions." link="/videos" linkLabel="Browse All" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {categories.map((category) => (
            <Link key={category.title} to={`/videos?category=${encodeURIComponent(category.title)}`} className="group relative aspect-[4/3] rounded-[22px] overflow-hidden bg-[#1A1A1A] border border-white/[0.08] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/60">
              <img src={category.image} alt={category.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/45" />
              <div className="absolute left-5 right-5 bottom-5">
                <h3 className="text-white text-xl md:text-[22px] font-black uppercase tracking-tight">{category.title}</h3>
                <p className="text-[#B0B0B0] text-sm md:text-base mt-1">{category.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}