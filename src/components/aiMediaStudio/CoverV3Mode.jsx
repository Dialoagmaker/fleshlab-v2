import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CoverV3PreviewEditor from './CoverV3PreviewEditor';

export default function CoverV3Mode({ frame, metadata, settings, itemFileName, onUseFallback }) {
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
          Advertising Photographer → Hero Image Reconstruction → Creative Director → Art Director → Commercial Validation → Final Cover.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CoverV3PreviewEditor frame={frame} metadata={effectiveMetadata} settings={settings} fileSuffix="key-art-v3" onUseFallback={onUseFallback} />
      </CardContent>
    </Card>
  );
}