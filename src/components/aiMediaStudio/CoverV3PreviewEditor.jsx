import { useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { blobToCanvasImage, canvasToBlob, getCoverDimensions } from '@/lib/aiMediaStudio/coverRenderer';
import { generatePosterPlan, renderPosterVariantToCanvas } from '@/lib/aiMediaStudio/commercialKeyArtEngine';

function MetricRow({ candidate }) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
      <span>Ad Score <b className="text-foreground">{candidate.impact_score}</b></span>
      <span>Hero <b className="text-foreground">{candidate.hero_score}</b></span>
      <span>Thumb <b className="text-foreground">{candidate.thumbnail_score}</b></span>
      <span>Desire <b className="text-foreground">{candidate.commercial_score}</b></span>
    </div>
  );
}

function DiagnosticTable({ diagnostics = [] }) {
  if (!diagnostics.length) return null;
  return (
    <div className="overflow-auto rounded-xl border border-border bg-secondary/20 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Runtime candidate data</p>
      <table className="w-full min-w-[980px] text-left text-[10px]">
        <thead className="text-muted-foreground">
          <tr><th>Candidate</th><th>Philosophy</th><th>Concept</th><th>Visual system</th><th>Render hash</th><th>Cache key</th><th>Title</th><th>Logo</th><th>Color</th></tr>
        </thead>
        <tbody>
          {diagnostics.map(item => (
            <tr key={item.candidateId} className="border-t border-border/60 align-top">
              <td className="py-1 font-mono text-foreground">{item.candidateId}</td>
              <td>{item.philosophyId}</td>
              <td className="font-mono">{item.conceptId}</td>
              <td>{item.visualSystemId}</td>
              <td className="font-mono text-foreground">{item.renderPlanHash}</td>
              <td className="font-mono">{item.canvasCacheKey}</td>
              <td>{item.titleGeometry?.side}</td>
              <td>{item.logoGeometry?.strategy}</td>
              <td>{item.colorStrategy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function drawFallbackPreview(canvas, image, metadata, dims) {
  if (!canvas || !image) return;
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext('2d');
  const scale = Math.max(dims.width / image.width, dims.height / image.height);
  const sw = dims.width / scale;
  const sh = dims.height / scale;
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, 0, 0, dims.width, dims.height);
  const grad = ctx.createLinearGradient(0, 0, dims.width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.78)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, dims.width, dims.height);
  ctx.fillStyle = '#f4f1ea';
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.lineWidth = Math.max(4, dims.width * 0.004);
  ctx.font = `900 ${Math.max(54, dims.width * 0.07)}px Impact, Arial Black, sans-serif`;
  const title = (metadata?.videoTitle || 'FLESHLAB ORIGINAL').toUpperCase();
  ctx.strokeText(title, dims.width * 0.06, dims.height * 0.48, dims.width * 0.5);
  ctx.fillText(title, dims.width * 0.06, dims.height * 0.48, dims.width * 0.5);
  ctx.fillStyle = '#cf102d';
  ctx.fillRect(dims.width * 0.06, dims.height * 0.52, dims.width * 0.22, Math.max(5, dims.height * 0.01));
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = `800 ${Math.max(22, dims.width * 0.018)}px Inter, sans-serif`;
  ctx.fillText((metadata?.optionalSubtitle || 'Best v3 failed-candidate preview').toUpperCase(), dims.width * 0.06, dims.height * 0.59, dims.width * 0.54);
}

export default function CoverV3PreviewEditor({ frame, metadata, settings, fileSuffix = 'key-art-v3', onUseFallback }) {
  const winnerCanvasRef = useRef(null);
  const candidateRefs = useRef([]);
  const imageRef = useRef(null);
  const rafRef = useRef(null);
  const [plan, setPlan] = useState(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState('');
  const [renderedCandidates, setRenderedCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const renderSeqRef = useRef(0);
  const dims = getCoverDimensions(settings);
  const automaticSettings = useMemo(() => ({ formatId: settings.formatId, customWidth: settings.customWidth, customHeight: settings.customHeight, sellingPoints: settings.sellingPoints }), [settings.formatId, settings.customWidth, settings.customHeight, settings.sellingPoints]);
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
        const nextPlan = await generatePosterPlan(image, { ...metadata, advertisingPhotographer: frame.advertisingPhotographer || null }, automaticSettings, dims.width, dims.height);
        if (active) {
          setPlan(nextPlan);
          setSelectedCandidateId(nextPlan.selected?.candidate_id || nextPlan.variants?.[0]?.candidate_id || null);
        }
      } catch (err) {
        if (active) {
          drawFallbackPreview(winnerCanvasRef.current, imageRef.current, metadata, dims);
          setRendered(true);
          setError(err.message || 'v3 candidate generation failed');
        }
      }
    })();
    return () => {
      active = false;
      if (imageRef.current?.close) imageRef.current.close();
      imageRef.current = null;
    };
  }, [key, automaticSettings]);

  useEffect(() => {
    if (!plan || !imageRef.current) return;
    const visibleCandidates = plan.variants.slice(0, 4);
    let active = true;
    window.requestAnimationFrame(async () => {
      try {
        const rendered = await Promise.all(visibleCandidates.map((candidate, index) => {
          const canvas = candidateRefs.current[index];
          if (!canvas) return Promise.resolve(null);
          return renderPosterVariantToCanvas(canvas, imageRef.current, plan, candidate, automaticSettings, dims.width, dims.height);
        }));
        if (!active) return;
        setRenderedCandidates(rendered.filter(Boolean).map(item => ({ candidateId: item.candidateId, renderPlanHash: item.renderPlanHash, visualSystemId: item.selected?.visualSystemId || item.visualSystemId, compositionMode: item.selected?.compositionMode, artworkValidation: item.selected?.artworkValidation })));
      } catch (err) {
        if (active) setError(err.message || 'v3 candidate render failed');
      }
    });
    return () => { active = false; };
  }, [plan, automaticSettings, dims.width, dims.height]);

  useEffect(() => {
    if (!plan || !imageRef.current || !winnerCanvasRef.current) return;
    window.cancelAnimationFrame(rafRef.current);
    setRendered(false);
    const renderSeq = renderSeqRef.current + 1;
    renderSeqRef.current = renderSeq;
    const frameId = window.requestAnimationFrame(async () => {
      try {
        const visibleCandidates = plan.variants.slice(0, 4);
        const selectedCandidate = visibleCandidates.find(candidate => candidate.candidate_id === selectedCandidateId) || plan.selected || visibleCandidates[0];
        await renderPosterVariantToCanvas(winnerCanvasRef.current, imageRef.current, plan, selectedCandidate, settings, dims.width, dims.height);
        if (renderSeq !== renderSeqRef.current) return;
        setRendered(true);
        setError('');
      } catch (err) {
        if (renderSeq !== renderSeqRef.current) return;
        drawFallbackPreview(winnerCanvasRef.current, imageRef.current, metadata, dims);
        setRendered(true);
        setError(err.message || 'v3 winner render failed');
      }
    });
    rafRef.current = frameId;
    return () => window.cancelAnimationFrame(frameId);
  }, [plan, selectedCandidateId, settings, dims.width, dims.height]);

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
  const selectedCandidate = visibleCandidates.find(candidate => candidate.candidate_id === selectedCandidateId) || plan?.selected || visibleCandidates[0];
  const selectedApproved = !!selectedCandidate?.score?.passesQualityGate;
  const canExport = rendered;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground">Automatic Commercial Key Art Generator</h3>
          <p className="text-xs text-muted-foreground">
            {plan ? `${plan.engine} · advertising artwork pipeline · Ad Score ${plan.selected.impact_score}/100` : `Exact output size: ${dims.width} × ${dims.height}px`}
          </p>
        </div>
        <Badge variant={rendered ? 'outline' : 'secondary'}>{rendered ? 'Artwork ready' : 'Painting artwork'}</Badge>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {onUseFallback && (error || (selectedCandidate && !selectedApproved)) && <Button variant="outline" onClick={onUseFallback}>Use v2 fallback</Button>}

      {selectedCandidate && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
          {selectedApproved ? 'Selected candidate' : 'Best attempt — not approved'}: <span className="text-foreground">{selectedCandidate.poster_family_label}</span> · {selectedApproved ? plan.winner_reason : selectedCandidate.rejection_reasons?.join(', ')}
          <MetricRow candidate={selectedCandidate} />
        </div>
      )}

      <DiagnosticTable diagnostics={plan?.diagnostics || []} />

      <div className="relative overflow-auto rounded-xl border border-border bg-black p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Winning Candidate</p>
        <canvas ref={winnerCanvasRef} className="mx-auto h-auto max-h-[72vh] max-w-full rounded-lg" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleCandidates.map((candidate, index) => (
          <button type="button" key={candidate.candidate_id} onClick={() => setSelectedCandidateId(candidate.candidate_id)} className={`rounded-xl border p-2 text-left transition ${candidate.candidate_id === selectedCandidate?.candidate_id ? 'border-primary bg-primary/10' : 'border-border bg-secondary/20 hover:bg-secondary/40'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground">Candidate {index + 1}</span>
              {candidate.candidate_id === plan.selected.candidate_id && <Badge variant="outline">Best score</Badge>}
            </div>
            <canvas ref={(node) => { candidateRefs.current[index] = node; }} className="h-auto w-full rounded-lg bg-black" />
            <p className="mt-2 text-xs font-semibold text-foreground">{candidate.poster_family_label}</p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">{candidate.render_plan_hash} · {candidate.visual_system_id}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{candidate.philosophy}</p>
            <MetricRow candidate={candidate} />
            {!!candidate.rejection_reasons?.length && (
              <p className="mt-2 text-[10px] text-muted-foreground">Needs work: {candidate.rejection_reasons.join(', ')}</p>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={!canExport} onClick={() => download('image/png')} className="gap-2"><Download className="h-4 w-4" />Download Selected PNG</Button>
        <Button disabled={!canExport} onClick={() => download('image/jpeg')} variant="outline" className="gap-2"><Download className="h-4 w-4" />Download Selected JPG</Button>
      </div>
    </div>
  );
}