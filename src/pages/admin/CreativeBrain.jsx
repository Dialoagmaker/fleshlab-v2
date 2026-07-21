import { useState } from "react";
import BrainUploadPanel from "@/components/creativeBrain/BrainUploadPanel";
import BlueprintJsonOutput from "@/components/creativeBrain/BlueprintJsonOutput";
import { runCreativeBrainPipeline } from "@/lib/creativeBrain/pipeline";

export default function CreativeBrain() {
  const [file, setFile] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setPipeline(null);
    setError("");
  };

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setPipeline(null);
    try {
      setPipeline(await runCreativeBrainPipeline(file));
    } catch (err) {
      setError(err.message || "The Creative Brain could not analyze this image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <BrainUploadPanel file={file} loading={loading} error={error} onFileChange={onFileChange} onAnalyze={analyze} />
      <BlueprintJsonOutput pipeline={pipeline} />
    </div>
  );
}