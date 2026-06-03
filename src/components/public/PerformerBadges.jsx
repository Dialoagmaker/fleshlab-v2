import React from "react";
import { Verified, MapPin, Crown, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isFilipino, isAsian } from "@/lib/performerSeoUtils";

/**
 * Performer Badges Component
 * Displays trust and content badges based on performer data
 */
export default function PerformerBadges({ performer }) {
  const badges = [];
  
  // Verified 18+ badge
  if (performer.verified) {
    badges.push({
      icon: Verified,
      label: "Verified 18+",
      color: "bg-primary/10 text-primary border-primary/30"
    });
  }
  
  // Nationality-based badges
  const nationality = performer.nationality;
  if (nationality) {
    if (isFilipino(nationality)) {
      badges.push({
        icon: MapPin,
        label: "Filipino",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/30"
      });
    } else if (isAsian(nationality)) {
      badges.push({
        icon: MapPin,
        label: "Asian",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/30"
      });
    } else {
      // Show actual nationality if not Asian/Filipino
      badges.push({
        icon: MapPin,
        label: nationality.split(',')[0].trim(),
        color: "bg-muted text-muted-foreground border-border"
      });
    }
  }
  
  // Fanclub badge
  if (performer.fanclub_enabled) {
    badges.push({
      icon: Crown,
      label: "Fanclub Available",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/30"
    });
  }
  
  if (badges.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, idx) => {
        const Icon = badge.icon;
        return (
          <Badge
            key={idx}
            variant="outline"
            className={`gap-1.5 px-3 py-1 border ${badge.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {badge.label}
          </Badge>
        );
      })}
    </div>
  );
}