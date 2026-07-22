import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, Palette } from "lucide-react";
import CampaignAssetGrid from "@/components/aiMediaStudio/campaignV1/CampaignAssetGrid";
import { composeCampaignFromHero, getCampaignMetadataSuggestion, mergeCampaignMetadata } from "@/lib/heroPhotography/campaignComposer";
import CampaignDetailsForm from "./CampaignDetailsForm";
import CampaignComposerComparison from "./CampaignComposerComparison";

const METADATA_FIELDS = ["campaignTitle", "performerName", "subtitle", "episode", "cta", "campaignLabel", "releaseName", "originalTitle"];

function storageKey(campaignFamily) {
  return `hero-campaign-metadata:${campaignFamily || "default"}`;
}

function readSavedMetadata(campaignFamily) {
  try { return JSON.parse(localStorage.getItem(storageKey(campaignFamily)) || "{}"); } catch { return {}; }
}

function cleanMetadata(metadata) {
  return Object.fromEntries(METADATA_FIELDS.map(key => [key, metadata?.[key] || ""]).concat([["source", metadata?.source || {}]]));
}

function validateMetadata(metadata) {
  const errors = {};
  if (!metadata?.campaignTitle?.trim()) errors.campaignTitle = "Campaign Title is required.";
  return errors;
}

export default function CampaignComposerPreview({ output, pipeline, campaignFamily }) {
  const [composer, setComposer] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const urlsRef = useRef([]);

  const aiSuggestion = useMemo(() => getCampaignMetadataSuggestion(output, pipeline, campaignFamily), [output, pipeline, campaignFamily]);
  const validation = validateMetadata(metadata);

  useEffect(() => {
    if (output?.status !== "succeeded" || !output?.heroImage) return;
    const savedMetadata = readSavedMetadata(campaignFamily);
    setMetadata(cleanMetadata(mergeCampaignMetadata({ output, pipeline, campaignFamily, savedMetadata })));
    setComposer(null);
    setError("");
  }, [output, pipeline, campaignFamily]);

  useEffect(() => () => urlsRef.current.forEach(url => URL.revokeObjectURL(url)), []);

  const composeAssets = async () => {
    if (validation.campaignTitle) return;
    urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    urlsRef.current = [];
    setLoading(true);
    setError("");
    const savedMetadata = readSavedMetadata(campaignFamily);
    composeCampaignFromHero(output, pipeline, campaignFamily, { userMetadata: metadata, savedMetadata })
      .then(result => {
        urlsRef.current = [...(result.visualAssets || [])].flatMap(asset => [asset.url, asset.legacyPreviewUrl].filter(Boolean));
        setComposer(result);
      })
      .catch(err => setError(err?.message || "Campaign Composer failed."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!composer || validation.campaignTitle || validation.performerName) return;
    const timer = window.setTimeout(() => composeAssets(), 450);
    return () => window.clearTimeout(timer);
  }, [metadata]);

  const resetToSuggestion = () => setMetadata(cleanMetadata({ ...aiSuggestion, source: Object.fromEntries(METADATA_FIELDS.map(key => [key, "ai"])) }));
  const saveToProject = () => localStorage.setItem(storageKey(campaignFamily), JSON.stringify(cleanMetadata({ ...metadata, source: Object.fromEntries(METADATA_FIELDS.map(key => [key, "project"])) })));

  if (output?.status !== "succeeded") return null;

  return (
    <section className="mt-5 rounded-xl border border-primary/30 bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Campaign Composer</p>
          <h3 className="mt-2 text-xl font-black text-foreground">Premium Entertainment Key Art</h3>
          <p className="mt-1 text-sm text-muted-foreground">Hero Photography now flows through Story Intelligence, Campaign Concept, Naming, Creative Direction, Graphic Design, Typography, and Final Key Art.</p>
        </div>
        <Palette className="h-6 w-6 text-primary" />
      </div>
      <CampaignDetailsForm metadata={metadata} aiSuggestion={aiSuggestion} validation={validation} warnings={composer?.typographyWarnings || []} onChange={setMetadata} onReset={resetToSuggestion} onSave={saveToProject} onGenerate={composeAssets} loading={loading} hasAssets={Boolean(composer?.visualAssets?.length)} />
      {loading && <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Composing three distinct premium key art campaigns from the same Hero Photography</div>}
      {error && <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {composer?.downstreamReady && <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200"><CheckCircle2 className="h-4 w-4" />Campaign output is available to downstream Campaign Assets.</div>}
      {composer?.visualAssets?.length > 0 && <CampaignComposerComparison improvedAssets={composer.visualAssets} />}
      {composer?.visualAssets?.length > 0 && <div className="mt-5"><CampaignAssetGrid assets={composer.visualAssets} /></div>}
    </section>
  );
}