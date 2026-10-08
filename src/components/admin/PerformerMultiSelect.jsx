import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Search, Image } from "lucide-react";

/**
 * Multi-Performer Select with Search
 * Shows performer avatars, names, and allows multi-select
 */
export default function PerformerMultiSelect({ 
  selectedPerformerIds = [], 
  onPerformersChange,
  allPerformers = [] 
}) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter performers by search query
  const filteredPerformers = allPerformers.filter(p => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(query) ||
      p.stage_name?.toLowerCase().includes(query) ||
      p.nationality?.toLowerCase().includes(query)
    );
  });

  // Separate selected and available performers
  const selectedPerformers = allPerformers.filter(p => selectedPerformerIds.includes(p.id));
  const availablePerformers = filteredPerformers.filter(p => !selectedPerformerIds.includes(p.id));

  const togglePerformer = (performerId) => {
    if (selectedPerformerIds.includes(performerId)) {
      // Remove
      onPerformersChange(selectedPerformerIds.filter(id => id !== performerId));
    } else {
      // Add
      onPerformersChange([...selectedPerformerIds, performerId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Performers */}
      <div className="space-y-2">
        <Label>Selected Performers ({selectedPerformers.length})</Label>
        {selectedPerformers.length === 0 ? (
          <div className="text-sm text-muted-foreground italic p-3 border border-dashed border-border rounded-lg">
            No performers selected. Search and select performers below.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedPerformers.map(performer => (
              <Badge
                key={performer.id}
                variant="secondary"
                className="gap-2 px-3 py-2 h-auto text-sm flex items-center"
              >
                {performer.profile_image_url ? (
                  <img
                    src={performer.profile_image_url}
                    alt={performer.display_name}
                    className="w-5 h-5 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {performer.display_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span>{performer.display_name}</span>
                <button
                  type="button"
                  onClick={() => togglePerformer(performer.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label>Search Performers</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, stage name, or nationality..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Available Performers List */}
      <div className="space-y-2">
        <Label>Available Performers</Label>
        <ScrollArea className="h-64 border border-border rounded-lg p-3 bg-card">
          {availablePerformers.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {searchQuery ? "No performers match your search" : "No available performers"}
            </div>
          ) : (
            <div className="space-y-2">
              {availablePerformers.map(performer => (
                <div
                  key={performer.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => togglePerformer(performer.id)}
                >
                  <Checkbox
                    checked={selectedPerformerIds.includes(performer.id)}
                    onCheckedChange={() => togglePerformer(performer.id)}
                  />
                  {performer.profile_image_url ? (
                    <img
                      src={performer.profile_image_url}
                      alt={performer.display_name}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Image className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {performer.display_name}
                      </span>
                      {performer.verified && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          ✓ Verified
                        </Badge>
                      )}
                      {performer.fanclub_enabled && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-500">
                          Fanclub
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {performer.nationality && (
                        <span>{performer.nationality}</span>
                      )}
                      {performer.video_count !== undefined && (
                        <span>• {performer.video_count} videos</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}