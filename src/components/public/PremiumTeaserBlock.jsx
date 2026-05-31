import { Play, Star, Users, Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function PremiumTeaserBlock({ title = "Want Full Access?" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/30 p-8">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        </div>
        
        <p className="text-muted-foreground mb-6 max-w-xl">
          Get exclusive access to full scenes, early releases, behind-the-scenes content, 
          and direct support for your favorite Asian twink performers.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-primary" />
            <span>Exclusive scenes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Play className="w-4 h-4 text-primary" />
            <span>Early access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            <span>Direct interaction</span>
          </div>
        </div>
        
        <div className="mt-8">
          <Link
            to="/fanclub"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Membership Coming Soon
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}