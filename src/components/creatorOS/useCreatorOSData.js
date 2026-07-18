import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useCreatorOSData(performerId, performerToken) {
  return useQuery({
    queryKey: ["creator-os-approved", performerId],
    enabled: !!performerId && !!performerToken,
    queryFn: async () => {
      const [os, payout] = await Promise.all([
        base44.functions.invoke("creatorOSService", { action: "get_creator_os", performer_id: performerId, performer_token: performerToken, auto_generate: true }),
        base44.functions.invoke("performerDashboardService", { action: "get_payout_summary", performer_id: performerId, performer_token: performerToken })
      ]);
      return { os: os.data || {}, payout: payout.data || {} };
    }
  });
}