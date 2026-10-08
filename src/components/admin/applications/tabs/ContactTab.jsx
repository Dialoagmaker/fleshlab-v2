import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactTab({ application, updateMutation }) {
  const [contactLog, setContactLog] = useState(application.contact_log || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveContactLog = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: application.id,
        data: { contact_log: contactLog }
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Label htmlFor="contact-log">Contact Log</Label>
            <Textarea
              id="contact-log"
              value={contactLog}
              onChange={(e) => setContactLog(e.target.value)}
              placeholder="Log all communications with the applicant..."
              className="min-h-[200px]"
            />
            <Button onClick={handleSaveContactLog} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Contact Log"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}