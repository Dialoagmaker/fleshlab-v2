// Cinematic dark animated gradient background placeholder.
// TODO: Enable real HeroBackgroundSampler after V1 video assets have been migrated 
// and preview/trailer URLs are available in VideoAsset records.

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