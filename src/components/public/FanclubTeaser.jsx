import React from "react";
import { Link } from "react-router-dom";
import { Heart, Crown, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Fanclub Teaser Block
 * Promotes performer fanclub subscriptions
 */
export default function FanclubTeaser() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/30 p-6">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Join the Fanclub</h3>
            <p className="text-xs text-muted-foreground">Exclusive access and perks</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Get exclusive access to behind-the-scenes content, early releases, direct messages 
          with performers, and special member-only events.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="w-3 h-3 text-primary" />
            <span>Exclusive content</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Heart className="w-3 h-3 text-primary" />
            <span>Direct interaction</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Crown className="w-3 h-3 text-primary" />
            <span>Early access</span>
          </div>
        </div>
        
        <Link to="/fanclub">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            View Fanclubs
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}