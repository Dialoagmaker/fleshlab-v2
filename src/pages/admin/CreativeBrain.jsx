import { useEffect, useState } from "react";
import BrainUploadPanel from "@/components/creativeBrain/BrainUploadPanel";
import BlueprintJsonOutput from "@/components/creativeBrain/BlueprintJsonOutput";
import HeroPhotographyPanel from "@/components/creativeBrain/HeroPhotographyPanel";
import { base44 } from "@/api/base44Client";
import { installLocalMediaPrivacyGuard } from "@/lib/aiMediaStudio/privacyGuard";
import { runCreativeBrainPipeline } from "@/lib/creativeBrain/pipeline";
import { TARGET_PLATFORMS, CAMPAIGN_FAMILIES } from "@/lib/creativeBrain/brandRules";

export default function CreativeBrain() {
  const [file, setFile] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [targetPlatform, setTargetPlatform] = useState(TARGET_PLATFORMS[0]);
  const [campaignFamily, setCampaignFamily] = useState(CAMPAIGN_FAMILIES[0]);
  const [userTitle, setUserTitle] = useState("");

  useEffect(() => {
    installLocalMediaPrivacyGuard(null, base44);
  }, []);

  const onFileChange = (event) => { setFile(event.target.files?.[0] || null); setPipeline(null); setError(""); };
  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true); setError(""); setPipeline(null);
    try { setPipeline(await runCreativeBrainPipeline(file, { targetPlatform, campaignFamily, userTitle })); }
    catch (err) { setError(err.message || "The Creative Brain could not analyze this image."); }
    finally { setLoading(false); }
  };

  return <div className="mx-auto max-w-6xl space-y-5"><BrainUploadPanel file={file} loading={loading} error={error} targetPlatform={targetPlatform} campaignFamily={campaignFamily} userTitle={userTitle} onTitleChange={setUserTitle} onTargetChange={setTargetPlatform} onFamilyChange={setCampaignFamily} onFileChange={onFileChange} onAnalyze={analyze} />{pipeline && <HeroPhotographyPanel sourceFrameFile={file} pipeline={pipeline} targetPlatform={targetPlatform} campaignFamily={campaignFamily} />}<BlueprintJsonOutput pipeline={pipeline} /></div>;
}