import React, { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShareArticle({ title, url }) {
  const [copied, setCopied] = React.useState(false);

  // Encode URL and title for safe sharing
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  // Share links
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Open share window
  const openShareWindow = (platformUrl) => {
    window.open(platformUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="border-t border-border pt-8 mt-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">Share this article</h3>
        <p className="text-sm text-muted-foreground">Share this story with your friends</p>
      </div>

      {/* Share buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Facebook */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.facebook)}
          className="gap-2 hover:bg-blue-500/10 hover:text-blue-500"
        >
          <Share2 className="w-4 h-4" />
          Facebook
        </Button>

        {/* X / Twitter */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.twitter)}
          className="gap-2 hover:bg-slate-500/10 hover:text-slate-500"
        >
          <Share2 className="w-4 h-4" />
          X
        </Button>

        {/* Reddit */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.reddit)}
          className="gap-2 hover:bg-orange-500/10 hover:text-orange-500"
        >
          <Share2 className="w-4 h-4" />
          Reddit
        </Button>

        {/* Telegram */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.telegram)}
          className="gap-2 hover:bg-blue-400/10 hover:text-blue-400"
        >
          <Share2 className="w-4 h-4" />
          Telegram
        </Button>

        {/* WhatsApp */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.whatsapp)}
          className="gap-2 hover:bg-green-500/10 hover:text-green-500"
        >
          <Share2 className="w-4 h-4" />
          WhatsApp
        </Button>

        {/* Copy Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy Link"}
        </Button>
      </div>

      {/* Instagram/TikTok hint */}
      <p className="text-xs text-muted-foreground">
        Share the link on Instagram or TikTok by copying it.
      </p>
    </div>
  );
}