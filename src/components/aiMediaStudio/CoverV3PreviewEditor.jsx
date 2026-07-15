import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { blobToCanvasImage } from '@/lib/aiMediaStudio/coverRenderer';
import { canvasToBlob, generateKeyArtPlan, getCoverDimensions, renderKeyArtToCanvas } from '@/lib/aiMediaStudio/posterKeyArtRenderer';

export default function CoverV3PreviewEditor({ frame, metadata, settings, fileSuffix = 'key-art-v3' }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const rafRef = useRef(null);
  const [plan, setPlan] = useState(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState('');
  const dims = getCoverDimensions(settings);
  const key = JSON.stringify({ metadata, width: dims.width, height: dims.height, frame: frame?.index });

  useEffect(() => {
    let active = true;
    setRendered(false);
    setPlan(null);
    setError('');
    if (!frame?.blob) return;
    (async () => {
      try {
        const image = await blobToCanvasImage(frame.blob);
        if (!active) return;
        imageRef.current = image;
        const nextPlan = await generateKeyArtPlan(image, metadata, settings, dims.width, dims.height);
        if (active) setPlan(nextPlan);
      } catch (err) {
        if (active) setError(err.message || 'v3 art direction failed');
      }
    })();
    return () => {
      active = false;
      if (imageRef.current?.close) imageRef.current.close();
      imageRef.current = null;
    };
  }, [key]);

  useEffect(() => {
    if (!plan || !imageRef.current || !canvasRef.current) return;
    window.cancelAnimationFrame(rafRef.current);
    setRendered(false);
    const frameId = window.requestAnimationFrame(async () => {
      try {
        await renderKeyArtToCanvas(canvasRef.current, imageRef.current, plan, metadata, settings, dims.width, dims.height);
        setRendered(true);
        setError('');
      } catch (err) {
        setError(err.message || 'v3 render rejected');
      }
    });
    rafRef.current = frameId;
    return () => window.cancelAnimationFrame(frameId);
  }, [plan, settings, metadata, dims.width, dims.height]);

  const download = async (type) => {
    if (!rendered || !canvasRef.current) return;
    const ext = type === 'image/png' ? 'png' : 'jpg';
    const blob = await canvasToBlob(canvasRef.current, type, 0.92);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleshlab_${fileSuffix}_${dims.width}x${dims.height}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground">Automatic Key Art Generator</h3>
          <p className="text-xs text-muted-foreground">
            {plan ? `${plan.artDirection.emotional_goal} · Impact ${plan.selected.impact_score}/100` : `Exact output size: ${dims.width} × ${dims.height}px`}
          </p>
        </div>
        <Badge variant={rendered ? 'outline' : 'secondary'}>{rendered ? 'v3 key art' : 'Art directing'}</Badge>
      </div>
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {plan?.artDirection?.design_review && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
          Dominant element: <span className="text-foreground">{plan.artDirection.visual_priority.dominant_element}</span> · Eye path: {plan.artDirection.eye_path.join(' → ')}
        </div>
      )}
      <div className="relative overflow-auto rounded-xl border border-border bg-black p-3">
        <canvas ref={canvasRef} className="mx-auto h-auto max-h-[72vh] max-w-full rounded-lg" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={!rendered} onClick={() => download('image/png')} className="gap-2"><Download className="h-4 w-4" />Download PNG</Button>
        <Button disabled={!rendered} onClick={() => download('image/jpeg')} variant="outline" className="gap-2"><Download className="h-4 w-4" />Download JPG</Button>
      </div>
    </div>
  );
}