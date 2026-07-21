import { useState } from "react";
import { base44 } from "@/api/base44Client";
import BrainUploadPanel from "@/components/creativeBrain/BrainUploadPanel";
import BlueprintJsonOutput from "@/components/creativeBrain/BlueprintJsonOutput";
import { CREATIVE_BRAIN_BLUEPRINT_SCHEMA, buildCreativeBrainInstruction } from "@/lib/creativeBrainBlueprint";

export default function CreativeBrain() {
  const [file, setFile] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setBlueprint(null);
    setError("");
  };

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setBlueprint(null);
    try {
      const privateUpload = await base44.integrations.Core.UploadPrivateFile({ file });
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: privateUpload.file_uri, expires_in: 900 });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildCreativeBrainInstruction(file.name),
        file_urls: [signed.signed_url],
        response_json_schema: CREATIVE_BRAIN_BLUEPRINT_SCHEMA,
      });
      setBlueprint(result);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "The Creative Brain could not analyze this image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <BrainUploadPanel file={file} loading={loading} error={error} onFileChange={onFileChange} onAnalyze={analyze} />
      <BlueprintJsonOutput blueprint={blueprint} />
    </div>
  );
}