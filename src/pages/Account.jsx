import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Settings, Video, CreditCard, Play, AlertCircle, Calendar, DollarSign } from "lucide-react";
import { getDashboardPath } from "@/lib/roleResolver";
import SEOMeta from "@/components/SEOMeta";

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState(null);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadUser();
    loadPurchases();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      setPurchasesLoading(true);
      const response = await base44.functions.invoke('getMyPurchases', {});
      setPurchases(response.data);
    } catch (error) {
      console.error("Failed to load purchases:", error);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading || purchasesLoading) {
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
        description="Manage your account settings and purchases"
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
                <p className="text-muted-foreground mt-1">Manage your account settings and purchases</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  const dashboardPath = getDashboardPath(user);
                  window.location.href = dashboardPath;
                }}>
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 border-b border-border">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'videos' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('videos')}
            >
              My Videos ({purchases?.summary?.total_ppv_purchases || 0})
            </Button>
            <Button
              variant={activeTab === 'subscriptions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('subscriptions')}
            >
              Subscriptions ({purchases?.summary?.active_subscriptions || 0})
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('history')}
            >
              Payment History
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'overview' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

              {/* Videos Summary */}
              <Card>
                <CardHeader>
                  <Video className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Purchased Videos</CardTitle>
                  <CardDescription>Access your library</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{purchases?.summary?.total_ppv_purchases || 0}</div>
                  <p className="text-xs text-muted-foreground">videos purchased</p>
                  <Button className="w-full mt-3" variant="outline" size="sm" onClick={() => setActiveTab('videos')}>
                    View All
                  </Button>
                </CardContent>
              </Card>

              {/* Subscriptions Summary */}
              <Card>
                <CardHeader>
                  <Calendar className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Active Subscriptions</CardTitle>
                  <CardDescription>Fanclub memberships</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{purchases?.summary?.active_subscriptions || 0}</div>
                  <p className="text-xs text-muted-foreground">active memberships</p>
                  <Button className="w-full mt-3" variant="outline" size="sm" onClick={() => setActiveTab('subscriptions')}>
                    View Details
                  </Button>
                </CardContent>
              </Card>

              {/* Payment History Summary */}
              <Card>
                <CardHeader>
                  <DollarSign className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{purchases?.summary?.total_payments || 0}</div>
                  <p className="text-xs text-muted-foreground">total payments</p>
                  <Button className="w-full mt-3" variant="outline" size="sm" onClick={() => setActiveTab('history')}>
                    View History
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">My Purchased Videos</h2>
              {!purchases?.purchased_videos || purchases.purchased_videos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No purchased videos yet
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {purchases.purchased_videos.map((video) => (
                    <Card key={video.id}>
                      {video.video_thumbnail && (
                        <img 
                          src={video.video_thumbnail} 
                          alt={video.video_title}
                          className="w-full h-40 object-cover rounded-t-md"
                        />
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg">{video.video_title}</CardTitle>
                        <CardDescription>
                          Purchased {new Date(video.purchase_date).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant={video.access_status === 'active' ? 'default' : 'secondary'}>
                            {video.access_status === 'active' ? 'Available' : 'Unavailable'}
                          </Badge>
                          <span className="text-sm font-medium">${video.amount_usd}</span>
                        </div>
                        {video.access_status === 'active' ? (
                          <Button className="w-full mt-3" size="sm" onClick={() => window.location.href = `/videos/${video.video_slug}`}>
                            <Play className="w-4 h-4 mr-2" />
                            Watch Now
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-3">
                            Purchased, but currently unavailable — contact support
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">My Subscriptions</h2>
              {!purchases?.subscriptions || purchases.subscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No active subscriptions
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {purchases.subscriptions.map((sub) => (
                    <Card key={sub.id}>
                      <CardHeader>
                        <CardTitle>{sub.fanclub_name}</CardTitle>
                        <CardDescription>{sub.plan_name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                              {sub.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Amount</span>
                            <span className="font-medium">${sub.amount_usd} / {sub.currency}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Access Until</span>
                            <span className="text-sm">{new Date(sub.access_until).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Payment History</h2>
              {!purchases?.payment_history || purchases.payment_history.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No payment history
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Provider</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchases.payment_history.map((payment) => (
                            <tr key={payment.id} className="border-b">
                              <td className="p-3 text-xs">
                                {new Date(payment.created_date).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-xs capitalize">
                                {payment.payment_type.replace('_', ' ')}
                              </td>
                              <td className="p-3 text-xs font-medium">
                                ${payment.amount_usd} {payment.currency}
                              </td>
                              <td className="p-3">
                                <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                                  {payment.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">
                                {payment.provider}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}