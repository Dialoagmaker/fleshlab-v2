import React from "react";
import { Link } from "react-router-dom";
import { Heart, Film, Users, Star, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Fan Production Teaser Block
 * Promotes user-generated content and guest productions
 */
export default function FanProductionTeaser() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/30 via-card to-card border border-purple-500/30 p-6">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Film className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Fan Production</h3>
            <p className="text-xs text-muted-foreground">Create content with us</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Want to be part of FLESHLAB? Apply for our fan production program and create 
          professional content with Asian twink performers. We provide equipment, editing, 
          and distribution.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="w-3 h-3 text-purple-400" />
            <span>Professional gear</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3 h-3 text-purple-400" />
            <span>Work with performers</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Crown className="w-3 h-3 text-purple-400" />
            <span>Revenue share</span>
          </div>
        </div>
        
        <Link to="/guest-production">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Apply Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}