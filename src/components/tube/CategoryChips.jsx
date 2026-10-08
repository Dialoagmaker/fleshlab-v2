const categories = [
  "Latest",
  "Asian Twinks",
  "Filipino / Pinoy",
  "Solo",
  "Outdoor",
  "Shower",
  "Studio Originals",
  "Fanclub Exclusives",
  "New Performers",
  "Trending",
  "Gay Asian Preview",
  "Twink",
  "Group",
  "POV",
];

export default function CategoryChips() {
  return (
    <div className="bg-[#0a0a0a] border-b border-white/10 py-3">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category, index) => (
            <button
              key={category}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                index === 0
                  ? "bg-rose-600/20 border-rose-600/50 text-rose-500"
                  : "bg-transparent border-white/20 text-white/70 hover:border-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}