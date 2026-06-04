/**
 * MultiPhotoUpload — upload up to N photos to R2.
 * Shows a grid of upload slots, each using the same R2 presign flow.
 */
import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, AlertCircle, X, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const SLOT_LABELS = [
  "Softcore photo 1",
  "Softcore photo 2",
  "Hardcore photo 1",
  "Hardcore photo 2",
  "Hardcore photo 3",
];

export default function MultiPhotoUpload({ sessionId, onKeysChanged, required = false }) {
  const [slots, setSlots] = useState(SLOT_LABELS.map(() => ({ status: "idle", fileName: null, r2Key: null, error: null })));
  const inputRefs = useRef([]);

  const handleFile = async (index, file) => {
    if (!file) return;
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, status: "uploading", fileName: file.name, error: null } : s));

    const res = await base44.functions.invoke("createApplicationUploadUrl", {
      application_session_id: sessionId,
      file_type: "photo",
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
    });

    if (!res.data?.upload_url) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, status: "error", error: res.data?.error || "Failed" } : s));
      return;
    }

    const uploadRes = await fetch(res.data.upload_url, {
      method: "PUT", body: file, headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, status: "error", error: "Storage upload failed" } : s));
      return;
    }

    const newSlots = slots.map((s, i) =>
      i === index ? { status: "done", fileName: file.name, r2Key: res.data.r2_key, error: null } : s
    );
    setSlots(newSlots);
    onKeysChanged(newSlots.filter(s => s.r2Key).map(s => s.r2Key));
  };

  const clearSlot = (index) => {
    const newSlots = slots.map((s, i) => i === index ? { status: "idle", fileName: null, r2Key: null, error: null } : s);
    setSlots(newSlots);
    if (inputRefs.current[index]) inputRefs.current[index].value = "";
    onKeysChanged(newSlots.filter(s => s.r2Key).map(s => s.r2Key));
  };

  const uploadedCount = slots.filter(s => s.status === "done").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-white/70 text-sm font-medium">Profile Photos</span>
        {required && <span className="text-rose-400 text-xs">*</span>}
        <span className={cn(
          "ml-auto text-xs font-bold",
          uploadedCount >= 5 ? "text-emerald-400" : "text-white/30"
        )}>
          {uploadedCount}/5 required
        </span>
      </div>
      <p className="text-white/35 text-xs">Upload at least 5 photos — include both softcore and hardcore shots.</p>
      <div className="grid grid-cols-5 gap-2">
        {slots.map((slot, i) => (
          <div key={i}>
            <input
              ref={el => inputRefs.current[i] = el}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => handleFile(i, e.target.files?.[0])}
            />
            <div
              className={cn(
                "aspect-square rounded-lg border cursor-pointer flex flex-col items-center justify-center gap-1 text-center transition-colors relative overflow-hidden",
                slot.status === "done"  ? "border-emerald-600/50 bg-emerald-600/8" :
                slot.status === "error" ? "border-red-600/50 bg-red-600/8" :
                "border-white/12 bg-white/3 hover:border-white/25"
              )}
              onClick={() => slot.status !== "uploading" && inputRefs.current[i]?.click()}
            >
              {slot.status === "idle" && <><Plus className="w-4 h-4 text-white/20" /><span className="text-[9px] text-white/25 leading-tight px-1">{SLOT_LABELS[i]}</span></>}
              {slot.status === "uploading" && <Loader2 className="w-4 h-4 text-white/50 animate-spin" />}
              {slot.status === "done" && (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-[9px] text-emerald-300 px-1 truncate w-full text-center">{slot.fileName}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); clearSlot(i); }}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                    <X className="w-2.5 h-2.5 text-white/60" />
                  </button>
                </>
              )}
              {slot.status === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}