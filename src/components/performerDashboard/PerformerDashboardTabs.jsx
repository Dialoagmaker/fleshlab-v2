import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "./OverviewTab";
import MyVideosTab from "./MyVideosTab";
import PlatformStatsTab from "./PlatformStatsTab";
import ComplianceTab from "./ComplianceTab";
import ContentUploadTab from "./ContentUploadTab";
import MySubmissionsTab from "./MySubmissionsTab";
import SupportTab from "./SupportTab";
import ProfileAndPayoutTab from "./ProfileAndPayoutTab";

export default function PerformerDashboardTabs({ performer }) {
  const [activeTab, setActiveTab] = useState("overview");

  const performerId = performer?.performer?.id;
  const performerToken = typeof window !== 'undefined' ? localStorage.getItem('performer_session_token') : null;

  if (!performerId || !performerToken) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading performer data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">My Videos</TabsTrigger>
          <TabsTrigger value="stats">Platform Stats</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="profile">Profile & Payout</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab performer={performer.performer} career_stats={performer.career_stats} />
        </TabsContent>

        <TabsContent value="videos">
          <MyVideosTab performerId={performerId} performerToken={performerToken} />
        </TabsContent>

        <TabsContent value="stats">
          <PlatformStatsTab performer={performer} />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceTab performerId={performerId} performerToken={performerToken} />
        </TabsContent>

        <TabsContent value="upload">
          <ContentUploadTab performerId={performerId} performerToken={performerToken} />
        </TabsContent>

        <TabsContent value="submissions">
          <MySubmissionsTab performerId={performerId} performerToken={performerToken} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileAndPayoutTab performer={performer} performerToken={performerToken} />
        </TabsContent>

        <TabsContent value="support">
          <SupportTab performerId={performerId} performerToken={performerToken} />
        </TabsContent>
      </Tabs>
    </div>
  );
}