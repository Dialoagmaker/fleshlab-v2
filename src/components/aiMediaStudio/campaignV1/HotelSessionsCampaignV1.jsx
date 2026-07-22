import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { createHotelSessionsCampaign } from "@/lib/aiMediaStudio/hotelSessionsCampaignV1";
import CampaignConsensusCard from "./CampaignConsensusCard";
import CampaignAssetGrid from "./CampaignAssetGrid";
import CampaignLaunchChecklist from "./CampaignLaunchChecklist";

export default function HotelSessionsCampaignV1({ item }) {
  const [campaign, setCampaign] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = !!item?.frames?.length;

  const createCampaign = async () => {
    setBusy(true);
    setError("");
    try {
      const nextCampaign = await createHotelSessionsCampaign(item);
      localStorage.setItem("fleshlab_hotel_sessions_latest_campaign", JSON.stringify({ consensus: nextCampaign.consensus, campaignId: nextCampaign.campaignId, createdAt: nextCampaign.createdAt }));
      setCampaign(nextCampaign);
    } catch (err) {
      setError(err.message || "Campaign creation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hotel Sessions Campaign V1</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Creative Brain → Brand Identity Engine → Campaign Generator</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">Create an official FLESHLAB campaign suite</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">The Brand Identity Engine integrates the official logo, Amateur Wins lockup, typography, creator branding, campaign title, CTA and platform spacing into every generated asset.</p>
          </div>
          {!ready && <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">Analyze one video first, then create the campaign.</div>}
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Button onClick={createCampaign} disabled={!ready || busy} className="gap-2"><Sparkles className="h-4 w-4" />{busy ? "Creating Campaign..." : "Create Campaign"}</Button>
        </CardContent>
      </Card>
      <CampaignConsensusCard campaign={campaign} />
      <CampaignLaunchChecklist items={campaign?.checklist || []} />
      <CampaignAssetGrid assets={campaign?.assets || []} />
    </div>
  );
}