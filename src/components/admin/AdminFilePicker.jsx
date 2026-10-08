import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AdminFilePicker({
  acceptedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
  maxSizeMB = 50,
  onFileSelect,
  onFileRemove,
  file,
  disabled = false,
  showProgress = false,
  progress = 0,
}) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be under ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    const fileExtension = "." + selectedFile.name.split(".").pop().toLowerCase();
    if (!acceptedTypes.includes(fileExtension) && !acceptedTypes.includes(selectedFile.type)) {
      setError(`File type not allowed. Accepted: ${acceptedTypes.join(", ")}`);
      return;
    }

    onFileSelect?.(selectedFile);
  };

  const handleRemove = () => {
    onFileRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
        {file ? (
          <div className="flex items-center gap-3">
            <File className="w-6 h-6 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {acceptedTypes.join(", ")} (max {maxSizeMB}MB)
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Select File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {showProgress && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Uploading...</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}