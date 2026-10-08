import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import KpiPeriodCard from "@/components/admin/executiveDashboard/KpiPeriodCard";
import AlertsBanner from "@/components/admin/executiveDashboard/AlertsBanner";
import TopPerformersPanel from "@/components/admin/executiveDashboard/TopPerformersPanel";
import TopVideosPanel from "@/components/admin/executiveDashboard/TopVideosPanel";
import TrafficPanel from "@/components/admin/executiveDashboard/TrafficPanel";
import WalletKpiPanel from "@/components/admin/executiveDashboard/WalletKpiPanel";

export default function ExecutiveDashboard() {
  const [period, setPeriod] = useState("today");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["executive-dashboard"],
    queryFn: async () => {
      const response = await base44.functions.invoke("executiveDashboardService", {});
      return response?.data || response;
    },
    retry: 1,
    staleTime: 0,
  });

  return (
    <>
      <SEOMeta title="Executive Dashboard — FLESHLAB Admin" description="Executive KPI dashboard." canonical="/admin/executive-dashboard" noIndex={true} />
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">KPIs, funnels, top content, traffic and alerts</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <AlertsBanner alerts={data?.alerts} />
            <WalletKpiPanel data={data?.wallet_kpis} />

            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="grid w-full grid-cols-4 max-w-md">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                <TabsTrigger value="last7">Last 7 Days</TabsTrigger>
                <TabsTrigger value="last30">Last 30 Days</TabsTrigger>
              </TabsList>
              {["today", "yesterday", "last7", "last30"].map((key) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <KpiPeriodCard data={data?.periods?.[key]} />
                </TabsContent>
              ))}
            </Tabs>

            <Tabs defaultValue="performers" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="performers">Top Performers</TabsTrigger>
                <TabsTrigger value="videos">Top Videos</TabsTrigger>
                <TabsTrigger value="traffic">Traffic</TabsTrigger>
              </TabsList>
              <TabsContent value="performers" className="mt-4"><TopPerformersPanel data={data?.top_performers} /></TabsContent>
              <TabsContent value="videos" className="mt-4"><TopVideosPanel data={data?.top_videos} /></TabsContent>
              <TabsContent value="traffic" className="mt-4"><TrafficPanel data={data?.traffic} /></TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}