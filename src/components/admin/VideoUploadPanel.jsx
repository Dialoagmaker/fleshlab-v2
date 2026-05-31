import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileVideo, Play, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import toast from "react-hot-toast";

const UPLOAD_STATUS = {
  IDLE: "idle",
  PREPARING: "preparing",
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  FINALIZING: "finalizing",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

const ACCESS_TIERS = [
  { value: "free", label: "Free" },
  { value: "fanclub", label: "Fanclub Only" },
  { value: "ppv", label: "PPV" },
];

export default function VideoUploadPanel({ onUploadComplete, existingVideoId }) {
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    brand_id: "",
    categories: [],
    tags: [],
    access_tier: "free",
  });
  const fileInputRef = useRef(null);
  const dragOverRef = useRef(false);

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: ['upload-status', files.map(f => f.video_id).filter(Boolean)],
    queryFn: async () => {
      const videoIds = files.map(f => f.video_id).filter(Boolean);
      if (videoIds.length === 0) return {};
      
      const results = {};
      await Promise.all(
        videoIds.map(async (videoId) => {
          const res = await base44.functions.invoke('getVideoUploadStatus', { video_id: videoId });
          results[videoId] = res.data;
        })
      );
      return results;
    },
    enabled: files.some(f => f.video_id && f.status !== UPLOAD_STATUS.IDLE && f.status !== UPLOAD_STATUS.FAILED),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (files.length > 0 && files[0].status === UPLOAD_STATUS.COMPLETED && onUploadComplete) {
      onUploadComplete({
        video_id: files[0].video_id,
        asset_id: files[0].asset_id,
        r2_key: files[0].r2_key,
        upload_url: files[0].upload_url,
        cdn_url: files[0].cdn_url,
        expires_in: files[0].expires_in,
      });
    }
  }, [files, onUploadComplete]);

  const uploadToR2 = async (file, uploadUrl, fileSize, mimeType) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          updateFileStatus(file.id, { 
            uploadProgress: percentComplete,
            uploadSpeed: e.loaded / ((e.timeStamp - file.startTime) / 1000) 
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', mimeType);
      xhr.setRequestHeader('Content-Length', fileSize.toString());
      xhr.send(file);
    });
  };

  const createUploadMutation = useMutation({
    mutationFn: async (fileData) => {
      const { file, title, description, brand_id, categories, tags, access_tier } = fileData;
      
      updateFileStatus(file.id, { status: UPLOAD_STATUS.PREPARING });
      
      const response = await base44.functions.invoke('createR2UploadUrl', {
        title,
        description,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        brand_id,
        categories,
        tags,
        access_tier,
      });

      return { file, ...response.data };
    },
    onSuccess: (data) => {
      updateFileStatus(data.file.id, {
        video_id: data.video_id,
        asset_id: data.asset_id,
        r2_key: data.r2_key,
        upload_url: data.upload_url,
        cdn_url: data.cdn_url,
        expires_in: data.expires_in,
        status: UPLOAD_STATUS.UPLOADING,
        startTime: Date.now(),
      });

      uploadToR2(data.file, data.upload_url, data.file.size, data.file.type)
        .then(() => {
          updateFileStatus(data.file.id, {
            status: UPLOAD_STATUS.UPLOADED,
            uploadProgress: 100,
          });

          finalizeUpload(data.video_id, data.asset_id);
        })
        .catch((error) => {
          updateFileStatus(data.file.id, {
            status: UPLOAD_STATUS.FAILED,
            error: error.message,
          });
          toast.error(`Upload failed: ${error.message}`);
        });
    },
    onError: (error) => {
      toast.error(`Failed to create upload: ${error.message}`);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async ({ video_id, asset_id }) => {
      return await base44.functions.invoke('finalizeUploadedVideo', { video_id, asset_id });
    },
    onSuccess: (data, variables) => {
      updateFileStatus(variables.video_id, {
        status: UPLOAD_STATUS.PROCESSING,
        job_id: data.data?.job_id,
      });
      toast.success('Upload complete! Processing started...');
    },
    onError: (error) => {
      toast.error(`Failed to finalize: ${error.message}`);
    },
  });

  const finalizeUpload = (videoId, assetId) => {
    updateFileStatus(videoId, { status: UPLOAD_STATUS.FINALIZING });
    finalizeMutation.mutate({ video_id: videoId, asset_id: assetId });
  };

  const updateFileStatus = (fileId, updates) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ));
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleFileSelect = (selectedFiles) => {
    if (!metadata.title || !metadata.description || !metadata.access_tier) {
      toast.error("Please fill in all required fields (Title, Description, Access Tier)");
      return;
    }

    const newFiles = Array.from(selectedFiles).map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: UPLOAD_STATUS.IDLE,
      uploadProgress: 0,
      title: metadata.title,
      description: metadata.description,
      brand_id: metadata.brand_id || null,
      categories: metadata.categories || [],
      tags: metadata.tags || [],
      access_tier: metadata.access_tier,
      slug: generateSlug(metadata.title),
    }));

    setFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(fileData => {
      createUploadMutation.mutate(fileData);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragOverRef.current = false;
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('video/')
    );
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dragOverRef.current = true;
  };

  const handleDragLeave = () => {
    dragOverRef.current = false;
  };

  const handleRetry = (fileData) => {
    setFiles(prev => prev.filter(f => f.id !== fileData.id));
    handleFileSelect([fileData.file]);
  };

  const handleDelete = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleOpenVideo = (videoId) => {
    window.location.href = `/admin/videos/${videoId}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case UPLOAD_STATUS.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case UPLOAD_STATUS.FAILED:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case UPLOAD_STATUS.PROCESSING:
      case UPLOAD_STATUS.FINALIZING:
      case UPLOAD_STATUS.UPLOADING:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <FileVideo className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status, uploadProgress, processingProgress) => {
    switch (status) {
      case UPLOAD_STATUS.PREPARING:
        return 'Preparing upload...';
      case UPLOAD_STATUS.UPLOADING:
        return `Uploading: ${uploadProgress?.toFixed(1)}%`;
      case UPLOAD_STATUS.UPLOADED:
        return 'Upload complete';
      case UPLOAD_STATUS.FINALIZING:
        return 'Finalizing...';
      case UPLOAD_STATUS.PROCESSING:
        const currentStep = processingProgress?.completed_steps || 0;
        const totalSteps = processingProgress?.total_steps || 5;
        return `Processing: ${currentStep}/${totalSteps}`;
      case UPLOAD_STATUS.COMPLETED:
        return 'Processing complete';
      case UPLOAD_STATUS.FAILED:
        return 'Failed';
      default:
        return 'Idle';
    }
  };

  const getProgressBarColor = (status) => {
    if (status === UPLOAD_STATUS.FAILED) return 'bg-red-500';
    if (status === UPLOAD_STATUS.COMPLETED) return 'bg-green-500';
    if (status === UPLOAD_STATUS.PROCESSING) return 'bg-blue-500';
    return 'bg-primary';
  };

  const canUpload = () => {
    return metadata.title && metadata.description && metadata.access_tier;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={metadata.title}
            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
            placeholder="Enter video title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={metadata.description}
            onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            placeholder="Enter video description"
            className="min-h-[100px]"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand (Optional)</Label>
            <Select
              value={metadata.brand_id}
              onValueChange={(value) => setMetadata({ ...metadata, brand_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Brand</SelectItem>
                {brands?.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_tier">Access Tier *</Label>
            <Select
              value={metadata.access_tier}
              onValueChange={(value) => setMetadata({ ...metadata, access_tier: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_TIERS.map(tier => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
          <Input
            id="tags"
            value={metadata.tags.join(', ')}
            onChange={(e) => setMetadata({ 
              ...metadata, 
              tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
            })}
            placeholder="e.g. solo, asian, twink"
          />
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          dragOverRef.current
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${!canUpload() ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => canUpload() && fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          {canUpload() ? "Drag and Drop Video Files" : "Fill in required fields first"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {canUpload() ? "or click to browse" : "Title, Description and Access Tier required"}
        </p>
        <p className="text-sm text-muted-foreground">
          Supported: MP4, MOV, WebM, MKV - Max: 10 GB per file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => handleFileSelect(Array.from(e.target.files))}
          className="hidden"
          disabled={!canUpload()}
        />
      </div>

      <AnimatePresence>
        {files.map((fileData) => {
          const statusInfo = statusData?.[fileData.video_id];
          const processingProgress = statusInfo?.processing_progress;
          
          return (
            <motion.div
              key={fileData.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border border-border rounded-lg p-4 bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(fileData.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      <h4 className="font-medium truncate">{fileData.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fileData.file.name} • {(fileData.file.size / 1024 / 1024 / 1024).toFixed(2)} GB
                      </p>
                    </div>
                  </div>

                  {(fileData.status === UPLOAD_STATUS.UPLOADING || 
                    fileData.status === UPLOAD_STATUS.PROCESSING) && (
                    <div className="mb-2">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${getProgressBarColor(fileData.status)}`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: fileData.status === UPLOAD_STATUS.UPLOADING 
                              ? `${fileData.uploadProgress}%`
                              : `${(processingProgress?.completed_steps || 0) / (processingProgress?.total_steps || 1) * 100}%`
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    {getStatusText(fileData.status, fileData.uploadProgress, processingProgress)}
                  </p>

                  {fileData.video_id && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                      <div>Video ID: <span className="text-green-400 font-mono">{fileData.video_id}</span></div>
                      <div>Asset ID: <span className="text-green-400 font-mono">{fileData.asset_id}</span></div>
                      <div>R2 Key: <span className="text-blue-400 font-mono break-all">{fileData.r2_key}</span></div>
                    </div>
                  )}

                  {fileData.status === UPLOAD_STATUS.FAILED && fileData.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>{fileData.error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 mt-3">
                    {fileData.status === UPLOAD_STATUS.FAILED && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(fileData)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(fileData.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}

                    {fileData.status === UPLOAD_STATUS.COMPLETED && fileData.video_id && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenVideo(fileData.video_id)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Open Video
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {files.length === 0 && (
        <Alert>
          <AlertDescription>
            Fill in the metadata fields above, then select a video file. The video will be created as a draft immediately, then uploaded to R2. Processing starts automatically after upload completes. Video remains in draft status.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}