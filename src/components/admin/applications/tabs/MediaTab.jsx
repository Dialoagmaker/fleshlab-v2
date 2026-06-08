import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function MediaTab({ application }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-300">
        <AlertTriangle className="w-4 h-4 inline mr-2" />
        <strong>Privacy Notice:</strong> These files contain sensitive content. Do not distribute.
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Profile Photo</h4>
            {application.profile_photo_r2_keys && application.profile_photo_r2_keys.length > 0 ? (
              <div className="text-sm text-muted-foreground">
                {application.profile_photo_r2_keys.length} file(s) uploaded
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No profile photo uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Intro Video</h4>
            {application.intro_video_r2_key ? (
              <div className="text-sm text-muted-foreground">File uploaded</div>
            ) : (
              <p className="text-sm text-muted-foreground">No intro video uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Hardcore Video</h4>
            {application.hardcore_video_r2_key ? (
              <div className="text-sm text-muted-foreground">File uploaded</div>
            ) : (
              <p className="text-sm text-muted-foreground">No hardcore video uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}