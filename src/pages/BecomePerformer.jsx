import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BecomePerformer() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6">
          FLESHLAB TALENT
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12">
          A new performer recruitment experience is being rebuilt from the ground up.
        </p>
        <Button
          size="lg"
          variant="outline"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}