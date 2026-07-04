import React from "react";
import { Lock, Play, Loader2, ShieldCheck, Zap, Infinity as InfinityIcon, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentMethodSelector from "@/components/payment/PaymentMethodSelector";

const BENEFITS = [
  { icon: Film, text: "Full uncensored scene" },
  { icon: Zap, text: "Instant access" },
  { icon: ShieldCheck, text: "Secure checkout" },
  { icon: InfinityIcon, text: "Watch anytime" },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: "Secure checkout" },
  { icon: Zap, text: "Instant access" },
  { icon: InfinityIcon, text: "Permanent unlock" },
];

function formatRuntime(secs) {
  if (!secs || secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Premium purchase box for the Video Detail page.
// Wallet + Crypto checkout are both handled by the existing PaymentMethodSelector —
// this component only changes presentation, never pricing or entitlement logic.
export default function VideoPurchaseBox({
  video, priceUsd, isAuthenticated, isUnlocking, unlockError, cta,
  handleUnlock, requireSignup, paymentProvider,
}) {
  const runtime = formatRuntime(video.duration_seconds);
  const isPPV = video.access_tier === "ppv";
  const isFanclub = video.access_tier === "fanclub";
  const buttonLabel = isFanclub ? "Join Fanclub" : "Watch Full Video Now";

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-card p-5 shadow-lg shadow-primary/5">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wide text-primary">Full Video Access</h3>
      </div>

      {/* Price + value */}
      <div className="flex items-baseline gap-2 mt-2 mb-1">
        {isPPV && (
          <span className="text-3xl font-extrabold text-foreground">${priceUsd}</span>
        )}
        {isFanclub && (
          <span className="text-3xl font-extrabold text-foreground">${priceUsd}<span className="text-sm font-medium text-muted-foreground">/mo</span></span>
        )}
        <span className="text-sm font-semibold text-muted-foreground">
          {isFanclub ? "Fanclub Access" : "Lifetime Access"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {runtime ? `${runtime} runtime • ` : ""}{isFanclub ? "Cancel anytime" : "Permanent unlock — watch whenever you want"}
      </p>

      {/* Benefits */}
      <ul className="space-y-2 mb-4">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2 text-sm text-foreground/90">
            <Icon className="w-4 h-4 text-primary shrink-0" />
            {text}
          </li>
        ))}
      </ul>

      {isFanclub && (
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-3 mb-4">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-1">Included with Fanclub</p>
          <p className="text-sm text-foreground font-semibold">Only ${priceUsd}/month</p>
          <p className="text-xs text-muted-foreground mt-0.5">Unlimited access to all Fanclub content</p>
          <a href="/fanclub" className="text-xs font-semibold text-purple-400 mt-1.5 inline-block">View Membership →</a>
        </div>
      )}

      {unlockError && <p className="text-red-400 text-xs mb-3">{unlockError}</p>}

      {isPPV ? (
        <PaymentMethodSelector
          paymentType="ppv"
          videoId={video.id} itemId={video.id} priceTier="standard"
          itemLabel={video.title} priceUsd={priceUsd}
          label={isAuthenticated ? buttonLabel : "Create Account to Unlock"}
          returnUrl={`/videos/${video.slug}`}
          cancelUrl={`/videos/${video.slug}`}
          isAuthenticated={isAuthenticated}
          onRequireAuth={() => requireSignup(window.location.pathname, "ppv", { videoId: video.id, videoSlug: video.slug, priceTier: "standard" })}
          paymentProvider={paymentProvider}
          className="w-full bg-primary hover:bg-primary/90 text-sm font-semibold"
        />
      ) : isFanclub ? (
        <PaymentMethodSelector
          paymentType="fanclub"
          planId="fanclub_6mo" itemId="fanclub_6mo"
          itemLabel="Fanclub Access" priceUsd={priceUsd}
          label={isAuthenticated ? buttonLabel : "Create Account to Join"}
          returnUrl="/fanclub"
          cancelUrl={`/videos/${video.slug}`}
          isAuthenticated={isAuthenticated}
          onRequireAuth={() => requireSignup("/fanclub", "fanclub", { planId: "fanclub_6mo" })}
          paymentProvider={paymentProvider}
          className="w-full bg-primary hover:bg-primary/90 text-sm font-semibold"
        />
      ) : (
        <Button onClick={handleUnlock} disabled={isUnlocking} className="w-full bg-primary hover:bg-primary/90 text-sm font-semibold gap-2">
          {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {cta.primaryText}
        </Button>
      )}

      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground mt-2 text-center">{cta.secondaryText}</p>
      )}

      {/* Trust indicators */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border/60">
        {TRUST_ITEMS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex flex-col items-center gap-1 text-center flex-1">
            <Icon className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[10px] text-muted-foreground leading-tight">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}