import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PerformerCard from "@/components/public/PerformerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, X, Loader2, Sparkles } from "lucide-react";

export default function Performers() {
  const [search, setSearch] = useState("");

  // Fetch performers, brands, and VideoPerformer records
  const { data: performers = [], isLoading } = useQuery({
    queryKey: ['public-performers'],
    queryFn: () => base44.entities.Performer.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: videoPerformers = [] } = useQuery({
    queryKey: ['public-video-performers'],
    queryFn: () => base44.entities.VideoPerformer.list(),
  });

  // Count videos per performer using VideoPerformer as source of truth
  const performerVideoCounts = useMemo(() => {
    const counts = {};
    videoPerformers.forEach(vp => {
      const performerId = vp.performer_id;
      counts[performerId] = (counts[performerId] || 0) + 1;
    });
    return counts;
  }, [videoPerformers]);

  // Filter performers
  const filteredPerformers = useMemo(() => {
    if (!search) return performers;
    
    const searchLower = search.toLowerCase();
    return performers.filter(p => 
      p.display_name.toLowerCase().includes(searchLower) ||
      (p.nationality && p.nationality.toLowerCase().includes(searchLower))
    );
  }, [performers, search]);

  const handleClear = () => setSearch("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero - Tube Style */}
      <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-background border-b border-border py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Asian Twink Performers</h1>
              <p className="text-muted-foreground text-sm">
                {filteredPerformers.length} {filteredPerformers.length === 1 ? 'performer' : 'performers'} • Meet the hottest Filipino and Asian stars
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
              placeholder="Search by name or nationality..."
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
         {filteredPerformers.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredPerformers.map(performer => (
              <PerformerCard 
                key={performer.id} 
                performer={performer} 
                brands={brands}
                videoCount={performerVideoCounts[performer.id] || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card/50 rounded-xl border border-border">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No performers found</h2>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try adjusting your search' : 'No performers available'}
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
  );
}