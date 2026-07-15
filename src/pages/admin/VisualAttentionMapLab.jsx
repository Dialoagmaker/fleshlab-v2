import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildVisualAttentionMap } from '@/lib/aiMediaStudio/visualAttentionMap';
import { buildOptimizationTrace } from '@/lib/aiMediaStudio/keyArtOptimizationPlanner';

function ScoreCard({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
    </div>
  );
}

function drawOverlay(canvas, image, map) {
  if (!canvas || !image || !map) return;
  const ctx = canvas.getContext('2d');
  const width = map.dimensions.width;
  const height = map.dimensions.height;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  const cellW = width / map.dimensions.cols;
  const cellH = height / map.dimensions.rows;

  map.cells.forEach(cell => {
    if (cell.energy < 0.18) return;
    const alpha = Math.min(0.72, cell.energy * 0.62);
    const red = Math.round(255 * cell.energy);
    const blue = Math.round(120 * (1 - cell.energy));
    ctx.fillStyle = `rgba(${red}, 0, ${blue}, ${alpha})`;
    ctx.fillRect(cell.x * cellW, cell.y * cellH, cellW, cellH);
  });

  if (map.hero_candidate) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, width * 0.004);
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(map.hero_candidate.x * width, map.hero_candidate.y * height, map.hero_candidate.w * width, map.hero_candidate.h * height);
    ctx.setLineDash([]);
  }
}

export default function VisualAttentionMapLab() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  const [map, setMap] = useState(null);
  const [optimizationTrace, setOptimizationTrace] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!map || !imageRef.current) return;
    drawOverlay(canvasRef.current, imageRef.current, map);
  }, [map]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setMap(null);
    setOptimizationTrace(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      const nextMap = buildVisualAttentionMap(image);
      setMap(nextMap);
      setOptimizationTrace(buildOptimizationTrace(nextMap));
    };
    image.onerror = () => setError('Image could not be loaded for visual attention diagnostics.');
    image.src = url;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Cover Engine Phase 1</h1>
            <Badge variant="outline">Diagnostics only</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Visual Attention Map validation page. This phase measures saliency and visual energy only; it does not alter Poster Engine v2 or any rendering output.
          </p>
        </div>
        <div>
          <input id="attention-file" type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <Button asChild><label htmlFor="attention-file">Upload frame or cover</label></Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {map ? (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <ScoreCard label="Visual Attention" value={map.scores.visual_attention} />
            <ScoreCard label="Face / Eye Proxy" value={map.scores.face_eye_priority} />
            <ScoreCard label="Body Silhouette" value={map.scores.body_silhouette_priority} />
            <ScoreCard label="Background Noise" value={map.scores.background_noise} />
            <ScoreCard label="Hero Proxy" value={map.scores.hero_dominance_proxy} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Visual Energy Overlay</CardTitle>
              </CardHeader>
              <CardContent>
                <canvas ref={canvasRef} className="h-auto w-full rounded-lg border border-border bg-black" />
                <p className="mt-3 text-xs text-muted-foreground">White dashed box = current hero candidate cluster. Red/blue heat = visual attention intensity.</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Rejection Reasons</CardTitle></CardHeader>
                <CardContent>
                  {map.rejection_reasons.length ? (
                    <ul className="space-y-2 text-sm text-destructive">
                      {map.rejection_reasons.map(reason => <li key={reason}>• {reason}</li>)}
                    </ul>
                  ) : <p className="text-sm text-green-400">No Phase-1 diagnostic rejection reasons.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Optimization Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {optimizationTrace?.actions.map(action => (
                    <div key={`${action.iteration_step}-${action.constraint}`} className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-foreground">Step {action.iteration_step}: {action.constraint}</span>
                        <Badge variant="outline">No render</Badge>
                      </div>
                      <p className="mt-2 text-muted-foreground">{action.failure}</p>
                      <p className="mt-2 text-foreground">{action.action}</p>
                      <p className="mt-2 text-muted-foreground">Expected: {action.expected_effect}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Top Attention Zones</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {map.top_zones.slice(0, 6).map((zone, index) => (
                    <div key={`${zone.x}-${zone.y}`} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-xs">
                      <span>#{index + 1} · cell {zone.x},{zone.y}</span>
                      <span className="font-bold text-foreground">{Math.round(zone.energy * 100)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Debug Output</CardTitle></CardHeader>
            <CardContent>
              <pre className="max-h-80 overflow-auto rounded-lg bg-black p-4 text-xs text-muted-foreground">{JSON.stringify({ scores: map.scores, hero_candidate: map.hero_candidate, debug: map.debug, rejection_reasons: map.rejection_reasons, optimization_trace: optimizationTrace }, null, 2)}</pre>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Upload a poster frame or existing cover to inspect its visual attention map.
          </CardContent>
        </Card>
      )}
    </div>
  );
}