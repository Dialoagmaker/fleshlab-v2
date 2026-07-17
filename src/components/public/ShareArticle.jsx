import React, { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShareArticle({ title, url, summary = "", category = "" }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary || title);
  const showLinkedIn = category === "pressRelease" || category === "casting";

  const platforms = [
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, hover: "hover:border-white/40 hover:bg-white hover:text-black" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, hover: "hover:border-blue-500 hover:bg-blue-500 hover:text-white" },
    { label: "Reddit", href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`, hover: "hover:border-orange-500 hover:bg-orange-500 hover:text-white" },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, hover: "hover:border-sky-400 hover:bg-sky-400 hover:text-black" },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, hover: "hover:border-green-500 hover:bg-green-500 hover:text-white" },
    ...(showLinkedIn ? [{ label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedSummary}`, hover: "hover:border-blue-700 hover:bg-blue-700 hover:text-white" }] : []),
  ];

  const openShareWindow = (href) => window.open(href, "_blank", "width=680,height=520");

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    await navigator.share({ title, text: summary || title, url });
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("News link copied");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#080b0e] p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">Share Update</p>
          <h3 className="mt-2 text-xl font-black text-white">Share this official update</h3>
        </div>
        {typeof navigator !== "undefined" && navigator.share && (
          <Button onClick={handleNativeShare} className="w-fit gap-2 bg-[#f0183d] text-white hover:bg-[#ff3152]">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <Button key={platform.label} variant="outline" size="sm" onClick={() => openShareWindow(platform.href)} className={`rounded-full border-white/12 bg-black/30 text-white/68 transition duration-300 hover:-translate-y-0.5 ${platform.hover}`}>
            {platform.label}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2 rounded-full border-white/12 bg-black/30 text-white/68 transition duration-300 hover:-translate-y-0.5 hover:border-[#f0183d] hover:bg-[#f0183d] hover:text-white">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy Link"}
        </Button>
      </div>
    </section>
  );
}