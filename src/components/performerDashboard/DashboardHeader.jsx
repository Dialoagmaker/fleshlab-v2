import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogOut, User, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

export default function DashboardHeader({ performer, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await base44.functions.invoke("getPerformerProfilePrivate", {});
      if (res.data.success) {
        setProfile(res.data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border-b border-border p-6">
        <div className="animate-pulse h-8 w-48 bg-muted rounded"></div>
      </div>
    );
  }

  const displayName = profile?.performer?.display_name || performer?.display_name || "Creator";
  const status = profile?.performer?.status || "active";
  const verified = profile?.performer?.verified || false;
  const profileImage = profile?.performer?.profile_image_url;

  const statusColors = {
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    inactive: "bg-red-500/10 text-red-500 border-red-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    suspended: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome back, {displayName}
                </h1>
                {verified && (
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge className={statusColors[status] || statusColors.active}>
                  {status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Creator HQ
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground max-w-xl">
                Manage your FLESHLAB profile, content submissions, compliance and payout details.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}