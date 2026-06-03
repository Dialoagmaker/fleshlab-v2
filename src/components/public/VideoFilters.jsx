import { useState, useEffect, useCallback } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/i18n";

// Approved taxonomy categories from Phase 2A - dynamically generated from actual video categories
// Note: Fanclub and PPV are access tiers, not categories - they exist only in ACCESS_TIERS
// Note: Exclusive is a boolean flag (is_exclusive), not a category - it has its own toggle filter
const CATEGORIES = [
  "All",
  "Asian",
  "Filipino",
  "Pinoy",
  "Twink",
  "Solo",
  "Outdoor",
  "Shower",
  "Mirror",
  "Dildo Play",
  "Nipple Play",
  "Blowjob",
  "Oral",
  "Anal",
  "Bareback",
  "Creampie",
  "Cumshot",
  "Rimming",
  "Handjob",
  "BDSM",
  "Daddy/Twink",
  "Age Gap",
  "Studio Production",
];

const ACCESS_TIERS = [
  { value: "all", label: "All Access" },
  { value: "free", label: "Free Preview" },
  { value: "fanclub", label: "Fanclub" },
  { value: "ppv", label: "PPV" },
];

const DURATIONS = [
  { value: "all", label: "Any Duration" },
  { value: "0-300", label: "Under 5 min", min: 0, max: 300 },
  { value: "300-900", label: "5–15 min", min: 300, max: 900 },
  { value: "900-1800", label: "15–30 min", min: 900, max: 1800 },
  { value: "1800-", label: "30+ min", min: 1800, max: null },
];

const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "views", label: "Most Viewed" },
  { value: "longest", label: "Longest" },
  { value: "trending", label: "Trending" },
];

export default function VideoFilters({ onFilterChange, brands = [] }) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [accessTier, setAccessTier] = useState("all");
  const [exclusive, setExclusive] = useState(false);
  const [brand, setBrand] = useState("all");
  const [duration, setDuration] = useState("all");
  const [sort, setSort] = useState("newest");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build filter state
  const filterState = {
    search: debouncedSearch,
    category: category === "all" ? null : category,
    access_tier: accessTier === "all" ? null : accessTier,
    exclusive: exclusive === true ? true : null,
    brand: brand === "all" ? null : brand,
    duration: duration === "all" ? null : DURATIONS.find(d => d.value === duration),
    sort,
  };

  // Notify parent of changes
  useEffect(() => {
    onFilterChange(filterState);
  }, [filterState, onFilterChange]);

  // Active filters for chips
  const activeFilters = [];
  if (debouncedSearch) activeFilters.push({ type: "search", label: `Search: "${debouncedSearch}"` });
  if (category !== "all") activeFilters.push({ type: "category", label: `Category: ${category}` });
  if (accessTier !== "all") activeFilters.push({ type: "access", label: `Access: ${ACCESS_TIERS.find(a => a.value === accessTier)?.label}` });
  if (exclusive === true) activeFilters.push({ type: "exclusive", label: "Exclusive" });
  if (brand !== "all") activeFilters.push({ type: "brand", label: `Brand: ${brands.find(b => b.id === brand)?.name || brand}` });
  if (duration !== "all") activeFilters.push({ type: "duration", label: `Duration: ${DURATIONS.find(d => d.value === duration)?.label}` });
  if (sort !== "newest") activeFilters.push({ type: "sort", label: `Sort: ${SORTS.find(s => s.value === sort)?.label}` });

  const clearFilter = (type) => {
    switch (type) {
      case "search": setSearch(""); break;
      case "category": setCategory("all"); break;
      case "access": setAccessTier("all"); break;
      case "exclusive": setExclusive(false); break;
      case "brand": setBrand("all"); break;
      case "duration": setDuration("all"); break;
      case "sort": setSort("newest"); break;
      default: break;
    }
  };

  const clearAll = () => {
    setSearch("");
    setCategory("all");
    setAccessTier("all");
    setExclusive(false);
    setBrand("all");
    setDuration("all");
    setSort("newest");
  };

  // Filter content (reused for desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-4">
      {/* Category Pills */}
      <div>
        <label className="text-xs font-semibold text-white/70 mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === "All" ? "all" : cat.toLowerCase())}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                (cat === "All" && category === "all") || category === cat.toLowerCase()
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-[#1a1a1a] text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Access Tier */}
      <div>
        <label className="text-xs font-semibold text-white/70 mb-2 block">Access Type</label>
        <Select value={accessTier} onValueChange={setAccessTier}>
          <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white">
            <SelectValue placeholder="Select access" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {ACCESS_TIERS.map((tier) => (
              <SelectItem key={tier.value} value={tier.value} className="text-white hover:bg-white/10">
                {tier.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exclusive Toggle */}
      <div>
        <label className="text-xs font-semibold text-white/70 mb-2 block">Exclusive Content</label>
        <button
          onClick={() => setExclusive(!exclusive)}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
            exclusive === true
              ? "bg-purple-600/20 border-purple-600/50 text-purple-400 shadow-lg shadow-purple-600/20"
              : "bg-[#1a1a1a] border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          {exclusive === true ? "✓ Exclusive Only" : "Show Exclusive Only"}
        </button>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Studio / Brand</label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              <SelectItem value="all" className="text-white hover:bg-white/10">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-white hover:bg-white/10">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="text-xs font-semibold text-white/70 mb-2 block">Duration</label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {DURATIONS.map((d) => (
              <SelectItem key={d.value} value={d.value} className="text-white hover:bg-white/10">
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-semibold text-white/70 mb-2 block">Sort By</label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white">
            <SelectValue placeholder="Select sort" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-white hover:bg-white/10">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <Input
          type="text"
          placeholder="Search videos, performers, studios, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder:text-white/40 h-12 pl-12 pr-4 rounded-xl focus:outline-none focus:border-rose-600/50 focus:ring-2 focus:ring-rose-600/20 transition-all"
        />
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="bg-rose-600/20 text-rose-500 border-rose-600/30 px-3 py-1 text-xs font-medium flex items-center gap-1.5"
            >
              {filter.label}
              <button
                onClick={() => clearFilter(filter.type)}
                className="hover:bg-rose-600/30 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-white/60 hover:text-white hover:bg-white/10 h-8 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Category Select */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40 bg-[#1a1a1a] border-white/10 text-white h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat === "All" ? "all" : cat.toLowerCase()} className="text-white hover:bg-white/10">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Access Tier */}
        <Select value={accessTier} onValueChange={setAccessTier}>
          <SelectTrigger className="w-36 bg-[#1a1a1a] border-white/10 text-white h-10">
            <SelectValue placeholder="Access" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {ACCESS_TIERS.map((tier) => (
              <SelectItem key={tier.value} value={tier.value} className="text-white hover:bg-white/10">
                {tier.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Brand */}
        {brands.length > 0 && (
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-40 bg-[#1a1a1a] border-white/10 text-white h-10">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              <SelectItem value="all" className="text-white hover:bg-white/10">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-white hover:bg-white/10">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Duration */}
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger className="w-36 bg-[#1a1a1a] border-white/10 text-white h-10">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {DURATIONS.map((d) => (
              <SelectItem key={d.value} value={d.value} className="text-white hover:bg-white/10">
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-36 bg-[#1a1a1a] border-white/10 text-white h-10">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-white hover:bg-white/10">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-[#1a1a1a] border-white/10 text-white hover:bg-white/10 h-10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(category !== "all" || accessTier !== "all" || exclusive === true || brand !== "all" || duration !== "all" || sort !== "newest") && (
                <Badge className="ml-2 bg-rose-600 text-white text-[10px]">
                  Active
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[#0a0a0a] border-white/10 max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-white">Filter Videos</SheetTitle>
            </SheetHeader>
            <div className="py-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}