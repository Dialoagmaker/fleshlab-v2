import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CoverV3PreviewEditor from './CoverV3PreviewEditor';

export default function CoverV3Mode({ frame, compareFrames = [], lockedHero = true, metadata, settings, itemFileName, onUseFallback }) {
  const effectiveMetadata = {
    ...metadata,
    videoTitle: metadata.videoTitle || '',
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">FLESHLAB Automatic Key Art</CardTitle>
          <Badge variant="outline">Cover Engine v4</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Advertising Photographer → human locked hero frame → dedicated KRAKEN-family renderer → export validation. {lockedHero ? 'Locked Hero Mode: typography and branding may change, the photograph may not.' : 'Hero locking is off.'}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {compareFrames.length > 1 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {compareFrames.map((compareFrame, index) => (
              <div key={compareFrame.index} className="rounded-xl border border-border bg-background/40 p-3">
                <Badge variant="outline" className="mb-3">Hero Frame {index + 1} · locked photograph</Badge>
                <CoverV3PreviewEditor frame={compareFrame} metadata={effectiveMetadata} settings={settings} fileSuffix={`key-art-kraken-frame-${index + 1}`} />
              </div>
            ))}
          </div>
        ) : (
          <CoverV3PreviewEditor key={frame?.index} frame={frame} metadata={effectiveMetadata} settings={settings} fileSuffix="key-art-kraken" onUseFallback={onUseFallback} />
        )}
      </CardContent>
    </Card>
  );
}