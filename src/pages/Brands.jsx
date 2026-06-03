import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import BrandCard from "@/components/public/BrandCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Search, X, Loader2, Crown } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

export default function Brands() {
  const [search, setSearch] = useState("");

  const { data: publicData, isLoading } = useQuery({
    queryKey: ['public-brands-fn'],
    queryFn: () => callPublicFunction('getPublicBrands'),
    retry: 0,
  });
  const brands = publicData?.brands || [];

  // Filter brands
  const filteredBrands = useMemo(() => {
    if (!search) return brands;
    
    const searchLower = search.toLowerCase();
    return brands.filter(b => 
      b.name.toLowerCase().includes(searchLower) ||
      (b.description && b.description.toLowerCase().includes(searchLower))
    );
  }, [brands, search]);

  const handleClear = () => setSearch("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="FLESHLAB Studios & Asian Gay Content Brands | Premium Studio Originals"
        description="Explore FLESHLAB Studios and partner brands producing premium Asian gay adult content, Filipino twink videos, verified 18+ performer productions, and exclusive studio releases."
        canonical="/brands"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "FLESHLAB Studios Brands",
          "description": "Premium Asian gay adult studio brands and production companies"
        }}
      />
      <div className="min-h-screen bg-background">
      {/* Hero - Studio Showcase */}
      <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-background border-b border-border py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">FLESHLAB Studios</h1>
              <p className="text-muted-foreground text-sm">
                {filteredBrands.length} {filteredBrands.length === 1 ? 'brand' : 'brands'} • Premium Asian twink content studios
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search studios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          {search && (
            <Button variant="outline" size="icon" onClick={handleClear} className="border-border">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Grid */}
        {filteredBrands.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map(brand => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card/50 rounded-xl border border-border">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No brands found</h2>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try adjusting your search' : 'No brands available'}
            </p>
            {search && (
              <Button variant="outline" onClick={handleClear}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}