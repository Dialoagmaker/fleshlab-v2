/**
 * FileUploadField — single file upload to private R2 via createApplicationUploadUrl
 * Used in the public Become a Performer form.
 */
import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, AlertCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function FileUploadField({
  label, hint, fileType, sessionId, accept, required = false,
  onUploaded, // (r2_key) => void
  onCleared,  // () => void
  className = "",
}) {
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [fileName, setFileName] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setStatus("uploading");
    setFileName(file.name);
    setErrorMsg(null);

    const res = await base44.functions.invoke("createApplicationUploadUrl", {
      application_session_id: sessionId,
      file_type: fileType,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
    });

    if (!res.data?.upload_url) {
      setStatus("error");
      setErrorMsg(res.data?.error || "Upload failed");
      return;
    }

    const uploadRes = await fetch(res.data.upload_url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      setStatus("error");
      setErrorMsg("Upload to storage failed");
      return;
    }

    setStatus("done");
    onUploaded(res.data.r2_key);
  };

  const handleClear = () => {
    setStatus("idle");
    setFileName(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
    onCleared?.();
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-white/70 text-sm font-medium">{label}</span>
        {required && <span className="text-rose-400 text-xs">*</span>}
      </div>
      {hint && <p className="text-white/35 text-xs">{hint}</p>}

      <div
        className={cn(
          "relative border rounded-xl px-4 py-4 cursor-pointer transition-colors text-center",
          status === "done"  ? "border-emerald-600/50 bg-emerald-600/8" :
          status === "error" ? "border-red-600/50 bg-red-600/8" :
          "border-white/15 bg-white/3 hover:border-white/30 hover:bg-white/5"
        )}
        onClick={() => status !== "uploading" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {status === "idle" && (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-5 h-5 text-white/30" />
            <span className="text-white/40 text-xs">Click to upload</span>
          </div>
        )}
        {status === "uploading" && (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
            <span className="text-white/60 text-xs">Uploading {fileName}…</span>
          </div>
        )}
        {status === "done" && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 text-xs truncate max-w-[180px]">{fileName}</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="text-white/30 hover:text-white/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-red-300 text-xs">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="text-white/30 hover:text-white/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}