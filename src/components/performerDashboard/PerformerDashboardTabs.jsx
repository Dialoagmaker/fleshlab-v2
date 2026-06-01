import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "./OverviewTab";
import EarningsTab from "./EarningsTab";
import ComplianceTab from "./ComplianceTab";
import MyVideosTab from "./MyVideosTab";
import FanclubTab from "./FanclubTab";
import SupportTab from "./SupportTab";
import PlatformStatsTab from "./PlatformStatsTab";

export default function PerformerDashboardTabs({ performer }) {
  const [activeTab, setActiveTab] = useState("overview");

  const performerId = performer?.performer?.id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-7 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="videos">My Videos</TabsTrigger>
          <TabsTrigger value="platform">Platform Stats</TabsTrigger>
          <TabsTrigger value="fanclub">Fanclub</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab performer={performer} />
        </TabsContent>

        <TabsContent value="earnings">
          <EarningsTab performerId={performerId} />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceTab performerId={performerId} />
        </TabsContent>

        <TabsContent value="videos">
          <MyVideosTab performerId={performerId} />
        </TabsContent>

        <TabsContent value="fanclub">
          <FanclubTab performerId={performerId} />
        </TabsContent>

        <TabsContent value="platform">
          <PlatformStatsTab performer={performer} />
        </TabsContent>

        <TabsContent value="support">
          <SupportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}