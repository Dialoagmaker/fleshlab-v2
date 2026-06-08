import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, Video, CreditCard } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Debug logging for role-based routing
      console.log('ACCOUNT_USER_DEBUG', {
        user_email: currentUser?.email,
        user_role: currentUser?.role,
        is_admin: currentUser?.role === 'admin' || currentUser?.role === 'super_admin',
        has_performer_profile: !!currentUser?.performer_profile_id || !!currentUser?.performer_id,
        resolved_dashboard_path: currentUser?.role === 'admin' || currentUser?.role === 'super_admin' 
          ? '/admin/dashboard' 
          : currentUser?.performer_profile_id || currentUser?.performer_id || currentUser?.role === 'performer'
            ? '/performer/dashboard'
            : '/client/dashboard'
      });
    } catch (error) {
      console.error("Failed to load user:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="My Account - FLESHLAB"
        description="Manage your account settings and preferences"
        canonical="/account"
        noIndex={true}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Account</h1>
                <p className="text-muted-foreground mt-1">Manage your account settings</p>
              </div>
              <Button variant="outline" onClick={() => {
                const dashboardPath = user?.role === 'admin' || user?.role === 'super_admin' 
                  ? '/admin/dashboard' 
                  : user?.performer_profile_id || user?.performer_id 
                    ? '/performer/dashboard' 
                    : '/client/dashboard';
                window.location.href = dashboardPath;
              }}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <User className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-foreground font-medium">{user?.full_name || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="text-foreground font-medium capitalize">{user?.role || "user"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card>
              <CardHeader>
                <Settings className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Settings</CardTitle>
                <CardDescription>Account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Videos Card */}
            <Card>
              <CardHeader>
                <Video className="w-10 h-10 text-primary mb-2" />
                <CardTitle>My Videos</CardTitle>
                <CardDescription>Access your purchased content</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  View Library
                </Button>
              </CardContent>
            </Card>

            {/* Billing Card */}
            <Card>
              <CardHeader>
                <CreditCard className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Billing</CardTitle>
                <CardDescription>Payment methods and history</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Manage Billing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}