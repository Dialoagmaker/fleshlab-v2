import { Shield, Globe, Award, Heart } from "lucide-react";

export default function StudioTrustBlock() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">Secure and Private</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Discreet billing, secure streaming
          </p>
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Globe className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">Asian Twink Specialists</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Authentic Filipino and Asian performers
          </p>
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Award className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">Studio Quality</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Professional 4K productions
          </p>
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">Performer Support</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Direct support for creators
          </p>
        </div>
      </div>
    </div>
  );
}