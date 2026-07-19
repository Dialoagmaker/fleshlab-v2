import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Upload, AlertCircle, Lock, FileText, Image as ImageIcon, Video, User } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { trackApplicationUploadOpened, trackUploadComplete, trackApplicationReadyForReview } from "@/lib/analytics";

export default function ApplicationUpload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sessionId = useMemo(() => `token-${token}`, [token]);

  useEffect(() => {
    if (!token) {
      setError("Missing upload token. Please check your link or contact support.");
      setLoading(false);
      return;
    }

    // Track upload link opened (Phase 2)
    trackApplicationUploadOpened({
      upload_status: 'unknown',
      photos_count: 0,
      videos_count: 0,
      id_uploaded: false,
      selfie_uploaded: false,
      missing_count: 8,
      token_valid: true,
      token_expired: false,
    });

    // Validate token without creating an upload intent
    base44.functions.invoke("uploadFileViaToken", {
      token,
      validate_only: true,
    })
      .then((res) => {
        const data = res.data || res;
        setApplication({ id: data.application_id });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired upload token");
        setLoading(false);
      });
  }, [token]);

  const [mediaKeys, setMediaKeys] = useState({
    profile_photo_r2_keys: [],
    intro_video_r2_key: null,
    hardcore_video_r2_key: null,
    id_document_front_r2_key: null,
    id_document_back_r2_key: null,
    selfie_with_id_r2_key: null,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file_type, file, photo_index }) => {
      // Step 1: Get upload URL
      const uploadRes = await base44.functions.invoke("uploadFileViaToken", {
        token,
        file_type,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        photo_index,
      });
      const uploadData = uploadRes.data || uploadRes;

      // Step 2: Upload to R2
      const uploadUrl = uploadData.upload_url;
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!putRes.ok) {
        throw new Error("Upload failed");
      }

      // Step 3: Finalize (update application record)
      const finalizeRes = await base44.functions.invoke("finalizeTokenUpload", {
        token,
        intent_id: uploadData.intent_id,
        r2_key: uploadData.r2_key,
        file_type,
        photo_index,
      });

      return { ...finalizeRes.data, file_type };
    },
    onSuccess: (data) => {
      if (data.file_type === "photo") {
        setMediaKeys((prev) => ({
          ...prev,
          profile_photo_r2_keys: [...(prev.profile_photo_r2_keys || []), data.r2_key],
        }));
      } else {
        setMediaKeys((prev) => ({ ...prev, [`${data.file_type}_r2_key`]: data.r2_key }));
      }
      
      // Track individual upload completion (Phase 2)
      const newPhotos = data.file_type === 'photo' ? mediaKeys.profile_photo_r2_keys.length + 1 : mediaKeys.profile_photo_r2_keys.length;
      const newVideos = (mediaKeys.intro_video_r2_key ? 1 : 0) + (mediaKeys.hardcore_video_r2_key ? 1 : 0) + (data.file_type.includes('video') ? 1 : 0);
      const idUploaded = !!(mediaKeys.id_document_front_r2_key || (data.file_type === 'id_document_front'));
      const selfieUploaded = !!(mediaKeys.selfie_with_id_r2_key || (data.file_type === 'selfie_with_id'));
      const missingCount = Math.max(0, 5 - newPhotos) + Math.max(0, 2 - newVideos) + (idUploaded ? 0 : 1) + (selfieUploaded ? 0 : 1);
      const readyForReview = newPhotos >= 5 && newVideos >= 2 && idUploaded && selfieUploaded;
      
      trackUploadComplete({
        upload_type: 'performer_application',
        upload_category: data.file_type,
        photos_count: newPhotos,
        videos_count: newVideos,
        id_uploaded: idUploaded,
        selfie_uploaded: selfieUploaded,
        missing_count: missingCount,
        ready_for_review: readyForReview,
      });
    },
    onError: (err) => {
      console.error("Upload error:", err);
    },
  });

  const handleFileUpload = async (file, file_type, photo_index) => {
    uploadMutation.mutate({ file_type, file, photo_index });
  };

  const mediaComplete =
    mediaKeys.profile_photo_r2_keys.length >= 5 &&
    mediaKeys.intro_video_r2_key &&
    mediaKeys.hardcore_video_r2_key &&
    mediaKeys.id_document_front_r2_key &&
    mediaKeys.selfie_with_id_r2_key;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Validating upload token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <SEOMeta title="Upload Error | FLESHLAB" canonical="/application-upload" robots="noindex" />
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111] border border-white/8 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Upload Link Invalid</h1>
            <p className="text-white/60 mb-6">{error}</p>
            <Button onClick={() => navigate("/")} className="bg-rose-600 hover:bg-rose-700">
              Go to Homepage
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOMeta title="Complete Your Application | FLESHLAB" canonical="/application-upload" robots="noindex" />
      <div className="min-h-screen bg-[#080808] text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5 mb-4">
              <Lock className="w-4 h-4 text-rose-400" />
              <span className="text-rose-300 text-sm font-semibold tracking-widest uppercase">Secure Upload</span>
            </div>
            <h1 className="text-4xl font-black mb-4">Complete Your Application</h1>
            <p className="text-white/60 text-lg">
              Upload or replace your required documents and media files. All files are stored securely and privately.
            </p>
          </div>

          {/* Success banner */}
          {mediaComplete && (
            <Alert className="bg-emerald-600/10 border-emerald-600/30 text-emerald-300 mb-8">
              <Check className="w-4 h-4" />
              <AlertDescription>
                All required files have been uploaded! The admin team will review your application within 48 hours.
              </AlertDescription>
            </Alert>
          )}

          {/* Upload sections */}
          <div className="space-y-8">
            {/* Photos */}
            <div className="bg-[#111] border border-white/8 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-600/15 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Profile Photos</h3>
                    <p className="text-white/45 text-sm">Upload 5 recent photos</p>
                  </div>
                </div>
                <Badge count={mediaKeys.profile_photo_r2_keys.length} required={5} />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <PhotoUploadSlot
                    key={i}
                    index={i}
                    uploaded={mediaKeys.profile_photo_r2_keys[i]}
                    onUpload={(file) => handleFileUpload(file, "photo", i)}
                    uploading={uploadMutation.isPending && uploadMutation.variables?.file_type === "photo" && uploadMutation.variables?.photo_index === i}
                  />
                ))}
              </div>
            </div>

            {/* Videos */}
            <div className="bg-[#111] border border-white/8 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-600/15 flex items-center justify-center">
                    <Video className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Required Videos</h3>
                    <p className="text-white/45 text-sm">Body presentation and performance</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <VideoUploadSlot
                  label="Body / Intro Video"
                  hint="Show your body, physique and presence"
                  uploaded={!!mediaKeys.intro_video_r2_key}
                  onUpload={(file) => handleFileUpload(file, "intro_video")}
                  uploading={uploadMutation.isPending && uploadMutation.variables?.file_type === "intro_video"}
                />
                <VideoUploadSlot
                  label="Hardcore / Action Video"
                  hint="Show explicit action (masturbation, etc.)"
                  uploaded={!!mediaKeys.hardcore_video_r2_key}
                  onUpload={(file) => handleFileUpload(file, "hardcore_video")}
                  uploading={uploadMutation.isPending && uploadMutation.variables?.file_type === "hardcore_video"}
                />
              </div>
            </div>

            {/* ID Documents */}
            <div className="bg-[#111] border border-white/8 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-600/15 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Identity Verification</h3>
                    <p className="text-white/45 text-sm">Government-issued ID documents</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <DocumentUploadSlot
                  label="ID Front"
                  hint="Passport, national ID, or driver's license (front)"
                  uploaded={!!mediaKeys.id_document_front_r2_key}
                  onUpload={(file) => handleFileUpload(file, "id_document_front")}
                  uploading={uploadMutation.isPending && uploadMutation.variables?.file_type === "id_document_front"}
                />
                <DocumentUploadSlot
                  label="ID Back (Optional for passport)"
                  hint="Back side of your ID document"
                  uploaded={!!mediaKeys.id_document_back_r2_key}
                  onUpload={(file) => handleFileUpload(file, "id_document_back")}
                  uploading={uploadMutation.isPending && uploadMutation.variables?.file_type === "id_document_back"}
                />
                <DocumentUploadSlot
                  label="Selfie with ID"
                  hint="Hold your ID next to your face"
                  uploaded={!!mediaKeys.selfie_with_id_r2_key}
                  onUpload={(file) => handleFileUpload(file, "selfie_with_id")}
                  uploading={uploadMutation.isPending && uploadMutation.variables?.file_type === "selfie_with_id"}
                />
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center text-white/40 text-sm">
            <p>Files are encrypted and stored in private R2 storage. Only FLESHLAB admin can access them.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Badge({ count, required }) {
  const isComplete = count >= required;
  return (
    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isComplete ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" : "bg-amber-600/20 text-amber-400 border border-amber-600/30"}`}>
      {count}/{required} {isComplete && <Check className="w-3 h-3 inline ml-1" />}
    </div>
  );
}

function PhotoUploadSlot({ index, uploaded, onUpload, uploading }) {
  const inputRef = React.useRef(null);

  return (
    <div
      className={`aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
        uploaded
          ? "border-emerald-600/40 bg-emerald-600/10"
          : uploading
          ? "border-rose-600/40 bg-rose-600/10"
          : "border-white/10 hover:border-white/25 hover:bg-white/3"
      }`}
      onClick={() => !uploaded && !uploading && inputRef.current?.click()}
    >
      {uploaded ? (
        <>
          <Check className="w-6 h-6 text-emerald-400 mb-1" />
          <span className="text-xs text-emerald-400 font-medium">Uploaded</span>
        </>
      ) : uploading ? (
        <>
          <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mb-1" />
          <span className="text-xs text-rose-400 font-medium">Uploading...</span>
        </>
      ) : (
        <>
          <ImageIcon className="w-6 h-6 text-white/30 mb-1" />
          <span className="text-xs text-white/40">Photo {index + 1}</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        disabled={!!uploaded || uploading}
      />
    </div>
  );
}

function VideoUploadSlot({ label, hint, uploaded, onUpload, uploading }) {
  const inputRef = React.useRef(null);

  return (
    <div
      className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
        uploaded
          ? "border-emerald-600/40 bg-emerald-600/10"
          : uploading
          ? "border-rose-600/40 bg-rose-600/10"
          : "border-white/10 hover:border-white/25 hover:bg-white/3"
      }`}
      onClick={() => !uploaded && !uploading && inputRef.current?.click()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${uploaded ? "text-emerald-400" : "text-white/70"}`}>{label}</span>
        {uploaded ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : uploading ? (
          <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="w-4 h-4 text-white/30" />
        )}
      </div>
      <p className="text-xs text-white/40">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        disabled={!!uploaded || uploading}
      />
    </div>
  );
}

function DocumentUploadSlot({ label, hint, uploaded, onUpload, uploading }) {
  const inputRef = React.useRef(null);

  return (
    <div
      className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-between cursor-pointer transition-colors ${
        uploaded
          ? "border-emerald-600/40 bg-emerald-600/10"
          : uploading
          ? "border-rose-600/40 bg-rose-600/10"
          : "border-white/10 hover:border-white/25 hover:bg-white/3"
      }`}
      onClick={() => !uploaded && !uploading && inputRef.current?.click()}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${uploaded ? "bg-emerald-600/20" : "bg-white/5"}`}>
          {uploaded ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-white/30" />}
        </div>
        <div>
          <p className={`text-sm font-medium ${uploaded ? "text-emerald-400" : "text-white/70"}`}>{label}</p>
          <p className="text-xs text-white/40">{hint}</p>
        </div>
      </div>
      {uploading && <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        disabled={!!uploaded || uploading}
      />
    </div>
  );
}