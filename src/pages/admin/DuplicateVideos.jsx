import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DuplicateVideoManager from "@/components/admin/DuplicateVideoManager";

export default function DuplicateVideos() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/videos" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Duplicate Video Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify and remove duplicate videos based on source file
          </p>
        </div>
      </div>

      <DuplicateVideoManager />
    </div>
  );
}