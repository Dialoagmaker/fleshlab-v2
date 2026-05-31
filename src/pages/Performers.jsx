import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PerformerCard from "@/components/public/PerformerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, X, Loader2 } from "lucide-react";

export default function Performers() {
  const [search, setSearch] = useState("");

  // Fetch performers and brands
  const { data: performers = [], isLoading } = useQuery({
    queryKey: ['public-performers'],
    queryFn: () => base44.entities.Performer.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

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
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">Performers</h1>
          <p className="text-muted-foreground">
            {filteredPerformers.length} {filteredPerformers.length === 1 ? 'performer' : 'performers'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search performers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {search && (
            <Button variant="outline" size="icon" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Grid */}
        {filteredPerformers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredPerformers.map(performer => (
              <PerformerCard key={performer.id} performer={performer} brands={brands} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No performers found</h2>
            <p className="text-muted-foreground">
              {search ? 'Try adjusting your search' : 'No performers available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}