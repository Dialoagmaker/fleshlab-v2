import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { blobToCanvasImage, canvasToBlob, getCoverDimensions } from '@/lib/aiMediaStudio/coverRenderer';
import { generatePosterPlan, renderPosterVariantToCanvas } from '@/lib/aiMediaStudio/commercialKeyArtEngine';

function MetricRow({ candidate }) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
      <span>Impact <b className="text-foreground">{candidate.impact_score}</b></span>
      <span>Hero <b className="text-foreground">{candidate.hero_score}</b></span>
      <span>Thumb <b className="text-foreground">{candidate.thumbnail_score}</b></span>
      <span>Comm. <b className="text-foreground">{candidate.commercial_score}</b></span>
    </div>
  );
}

export default function CoverV3PreviewEditor({ frame, metadata, settings, fileSuffix = 'key-art-v3' }) {
  const winnerCanvasRef = useRef(null);
  const candidateRefs = useRef([]);
  const imageRef = useRef(null);
  const rafRef = useRef(null);
  const [plan, setPlan] = useState(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState('');
  const renderSeqRef = useRef(0);
  const dims = getCoverDimensions(settings);
  const key = JSON.stringify({ metadata, width: dims.width, height: dims.height, frame: frame?.index });
  const settingsKey = JSON.stringify(settings);

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
        const nextPlan = await generatePosterPlan(image, metadata, settings, dims.width, dims.height);
        if (active) setPlan(nextPlan);
      } catch (err) {
        if (active) setError(err.message || 'v3 candidate generation failed');
      }
    })();
    return () => {
      active = false;
      if (imageRef.current?.close) imageRef.current.close();
      imageRef.current = null;
    };
  }, [key]);

  useEffect(() => {
    if (!plan || !imageRef.current || !winnerCanvasRef.current) return;
    window.cancelAnimationFrame(rafRef.current);
    setRendered(false);
    const renderSeq = renderSeqRef.current + 1;
    renderSeqRef.current = renderSeq;
    const frameId = window.requestAnimationFrame(async () => {
      try {
        const visibleCandidates = plan.variants.slice(0, 4);
        await Promise.all(visibleCandidates.map((candidate, index) => {
          const canvas = candidateRefs.current[index];
          if (!canvas) return Promise.resolve();
          return renderPosterVariantToCanvas(canvas, imageRef.current, plan, candidate, settings, dims.width, dims.height);
        }));
        await renderPosterVariantToCanvas(winnerCanvasRef.current, imageRef.current, plan, plan.selected, settings, dims.width, dims.height);
        if (renderSeq !== renderSeqRef.current) return;
        setRendered(true);
        setError('');
      } catch (err) {
        if (renderSeq !== renderSeqRef.current) return;
        setError(err.message || 'v3 candidate render failed');
      }
    });
    rafRef.current = frameId;
    return () => window.cancelAnimationFrame(frameId);
  }, [plan, settingsKey, metadata, dims.width, dims.height]);

  const download = async (type) => {
    if (!rendered || !winnerCanvasRef.current) return;
    const ext = type === 'image/png' ? 'png' : 'jpg';
    const blob = await canvasToBlob(winnerCanvasRef.current, type, 0.92);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleshlab_${fileSuffix}_winner_${dims.width}x${dims.height}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleCandidates = plan?.variants?.slice(0, 4) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground">Automatic Commercial Key Art Generator</h3>
          <p className="text-xs text-muted-foreground">
            {plan ? `${plan.engine} · painted artwork pipeline · Impact ${plan.selected.impact_score}/100` : `Exact output size: ${dims.width} × ${dims.height}px`}
          </p>
        </div>
        <Badge variant={rendered ? 'outline' : 'secondary'}>{rendered ? 'Artwork ready' : 'Painting artwork'}</Badge>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {plan?.selected && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
          Winner: <span className="text-foreground">{plan.selected.poster_family_label}</span> · {plan.winner_reason}
          <MetricRow candidate={plan.selected} />
        </div>
      )}

      <div className="relative overflow-auto rounded-xl border border-border bg-black p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Winning Candidate</p>
        <canvas ref={winnerCanvasRef} className="mx-auto h-auto max-h-[72vh] max-w-full rounded-lg" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleCandidates.map((candidate, index) => (
          <div key={candidate.poster_family_id} className={`rounded-xl border p-2 ${candidate.poster_family_id === plan.selected.poster_family_id ? 'border-primary bg-primary/10' : 'border-border bg-secondary/20'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground">Candidate {index + 1}</span>
              {candidate.poster_family_id === plan.selected.poster_family_id && <Badge variant="outline">Winner</Badge>}
            </div>
            <canvas ref={(node) => { candidateRefs.current[index] = node; }} className="h-auto w-full rounded-lg bg-black" />
            <p className="mt-2 text-xs font-semibold text-foreground">{candidate.poster_family_label}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{candidate.philosophy}</p>
            <MetricRow candidate={candidate} />
            {!!candidate.rejection_reasons?.length && (
              <p className="mt-2 text-[10px] text-muted-foreground">Needs work: {candidate.rejection_reasons.join(', ')}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={!rendered} onClick={() => download('image/png')} className="gap-2"><Download className="h-4 w-4" />Download Winner PNG</Button>
        <Button disabled={!rendered} onClick={() => download('image/jpeg')} variant="outline" className="gap-2"><Download className="h-4 w-4" />Download Winner JPG</Button>
      </div>
    </div>
  );
}