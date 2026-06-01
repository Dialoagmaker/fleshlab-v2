import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { LogOut, Video, Upload, MessageSquare } from "lucide-react";

export default function DashboardHeader({ performer, onLogout }) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Creator HQ</h1>
            <p className="text-sm text-muted-foreground">
              {performer?.performer?.display_name || "Performer Dashboard"}
            </p>
            <p className="text-xs text-muted-foreground">
              Your studio dashboard. Track your status, content, earnings and compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" disabled className="gap-2 opacity-50 hidden sm:flex">
              <Video className="w-4 h-4" />
              Go Live Now
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </Button>
            <Button variant="outline" size="sm" disabled className="gap-2 opacity-50 hidden sm:flex">
              <Upload className="w-4 h-4" />
              Upload Content
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </Button>
            <Button variant="outline" size="sm" disabled className="gap-2 opacity-50">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}