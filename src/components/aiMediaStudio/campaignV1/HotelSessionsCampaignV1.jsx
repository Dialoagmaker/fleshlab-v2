import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createHotelSessionsCampaign, createHotelSessionsCampaignComparison } from "@/lib/aiMediaStudio/hotelSessionsCampaignV1";
import CampaignConsensusCard from "./CampaignConsensusCard";
import CampaignAssetGrid from "./CampaignAssetGrid";
import CampaignLaunchChecklist from "./CampaignLaunchChecklist";
import ArtDirectionDiagnostics from "./ArtDirectionDiagnostics";
import ArtDirectionVariationComparison from "./ArtDirectionVariationComparison";

export default function HotelSessionsCampaignV1({ item }) {
  const [campaign, setCampaign] = useState(null);
  const [busy, setBusy] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");
  const [privateDevelopmentActive, setPrivateDevelopmentActive] = useState(false);
  const ready = !!item?.frames?.length;

  useEffect(() => {
    let mounted = true;
    base44.functions.invoke("openRouterAICover", { action: "development_mode_status" })
      .then(response => mounted && setPrivateDevelopmentActive(Boolean(response.data?.private_development_mode?.active)))
      .catch(() => mounted && setPrivateDevelopmentActive(false));
    return () => { mounted = false; };
  }, []);

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

  const createComparison = async () => {
    setBusy(true);
    setError("");
    try {
      const nextComparison = await createHotelSessionsCampaignComparison(item);
      setComparison(nextComparison);
    } catch (err) {
      setError(err.message || "Comparison creation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Hotel Sessions Campaign V1</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Creative Brain → Brand Identity → Art Direction → Campaign Generator</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">Create an art-directed FLESHLAB campaign suite</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">The Art Direction Engine now chooses crop strategy, focal hierarchy, logo prominence, title geometry, CTA visibility, contrast treatment and platform-specific staging before rendering.</p>
          </div>
          {!ready && <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">Analyze one video first, then create the campaign.</div>}
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={createCampaign} disabled={!ready || busy} className="gap-2"><Sparkles className="h-4 w-4" />{busy ? "Creating..." : "Create Art-Directed Campaign"}</Button>
            <Button onClick={createComparison} disabled={!ready || busy} variant="outline" className="gap-2"><Sparkles className="h-4 w-4" />Create 3-Direction Comparison</Button>
          </div>
        </CardContent>
      </Card>
      <CampaignConsensusCard campaign={campaign} />
      <ArtDirectionDiagnostics campaign={campaign} visible={privateDevelopmentActive} />
      <ArtDirectionVariationComparison comparison={comparison} />
      <CampaignLaunchChecklist items={campaign?.checklist || []} />
      <CampaignAssetGrid assets={campaign?.assets || []} />
    </div>
  );
}