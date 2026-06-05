import React, { useState, useMemo } from "react";
import { Search, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Category Selector Component
 * Grouped checkbox multi-select with search functionality
 */
export default function CategorySelector({
  taxonomyGroups,
  selectedCategories,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}) {
  const [expandedGroups, setExpandedGroups] = useState({});

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Filter categories based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return taxonomyGroups;
    }

    const query = searchQuery.toLowerCase().trim();
    return taxonomyGroups
      .map(group => ({
        ...group,
        categories: group.categories.filter(cat => {
          const labelMatch = cat.label.toLowerCase().includes(query);
          const slugMatch = cat.slug.toLowerCase().includes(query);
          const aliasMatch = cat.aliases?.some(alias => alias.toLowerCase().includes(query));
          return labelMatch || slugMatch || aliasMatch;
        })
      }))
      .filter(group => group.categories.length > 0);
  }, [taxonomyGroups, searchQuery]);

  // Check if category is selected
  const isSelected = (catId) => selectedCategories.includes(catId);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Groups */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto border border-border rounded-lg p-3 bg-muted/30">
        {filteredGroups.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No categories found for "{searchQuery}"
          </div>
        ) : (
          filteredGroups.map(group => {
            const isExpanded = expandedGroups[group.id] || false;
            const selectedInGroup = group.categories.filter(cat => isSelected(cat.id)).length;

            return (
              <div key={group.id} className="border border-border rounded-lg overflow-hidden">
                {/* Group Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{group.label}</span>
                    {selectedInGroup > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedInGroup} selected
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Group Categories */}
                {isExpanded && (
                  <div className="px-3 py-2 bg-card/50 space-y-1">
                    {group.categories.map(cat => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected(cat.id)}
                          onChange={() => onCategoryChange(cat.id)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-foreground">{cat.label}</span>
                        {isSelected(cat.id) && (
                          <Check className="w-3 h-3 text-green-600 ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Count */}
      <div className="text-xs text-muted-foreground">
        {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : 'y'} selected
        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={() => taxonomyGroups.forEach(g => g.categories.forEach(c => {
              if (isSelected(c.id)) onCategoryChange(c.id);
            }))}
            className="ml-2 text-destructive hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}