import React from "react";
import { Shield, Globe, Award, Heart } from "lucide-react";

export default function StudioTrustBlock() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Secure and Private */}
      <div className="bg-card rounded-xl p-6 border border-border text-center hover:border-primary/40 transition-colors">
        <div className="w-14 h-14 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-bold text-foreground mb-2">Secure {"&"} Private</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your privacy is our priority. Discreet billing, secure streaming, and no data sharing.
        </p>
      </div>

      {/* Asian Twink Specialists */}
      <div className="bg-card rounded-xl p-6 border border-border text-center hover:border-primary/40 transition-colors">
        <div className="w-14 h-14 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-bold text-foreground mb-2">Asian Twink Specialists</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Exclusively featuring the hottest Filipino and Asian performers in the industry.
        </p>
      </div>

      {/* Studio Quality */}
      <div className="bg-card rounded-xl p-6 border border-border text-center hover:border-primary/40 transition-colors">
        <div className="w-14 h-14 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-bold text-foreground mb-2">Studio Quality</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Professional 4K productions with cinematic lighting and authentic performances.
        </p>
      </div>

      {/* Performer Support */}
      <div className="bg-card rounded-xl p-6 border border-border text-center hover:border-primary/40 transition-colors">
        <div className="w-14 h-14 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-bold text-foreground mb-2">Performer Support</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Fair compensation, safe working conditions, and direct fan interaction opportunities.
        </p>
      </div>
    </div>
  );
}