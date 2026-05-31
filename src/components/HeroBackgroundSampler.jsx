/**
 * HeroBackgroundSampler — Dormant Cinematic Placeholder
 * 
 * SAFETY: This component is intentionally CSS-only and dormant. It renders no queries,
 * no video tags, and no R2 dependencies. It is visually optional and will never block
 * Home page rendering or trigger any migration/processing logic.
 * 
 * STATUS: Placeholder mode (animated gradient + vignette only).
 * 
 * ENABLEMENT: Real background video sampling will be enabled ONLY AFTER:
 *   - V1 → V2 video asset migration is complete
 *   - VideoAsset records contain valid trailer/preview cdn_urls
 *   - All assets have status="ready"
 * 
 * DO NOT expand this component further until post-migration enablement is approved.
 * DO NOT add queries, video tags, or processing until migration data is validated.
 */

export default function HeroBackgroundSampler() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Animated gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-background/60 to-background opacity-80 animate-pulse" 
        style={{ animationDuration: '6s', animationDirection: 'alternate' }}
      />
      
      {/* Crimson glow accent */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary rounded-full filter blur-3xl opacity-10"
        style={{ animation: 'float 8s ease-in-out infinite' }}
      />
      
      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)'
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -55%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}