import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildVisualAttentionMap } from '@/lib/aiMediaStudio/visualAttentionMap';
import { DEFAULT_CANDIDATE_PARAMS, posterImpactProxy, runOneOptimizationIteration } from '@/lib/aiMediaStudio/keyArtOptimizationPlanner';

const HISTORY_KEY = 'fleshlab_cover_engine_optimization_history';

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

function ActionTable({ results }) {
  if (!results?.length) return null;
  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-xs">
        <thead className="bg-secondary/60 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Reason</th>
            <th className="px-3 py-2 text-left">Parameter</th>
            <th className="px-3 py-2 text-right">Old</th>
            <th className="px-3 py-2 text-right">New</th>
            <th className="px-3 py-2 text-right">Expected</th>
            <th className="px-3 py-2 text-right">Actual</th>
            <th className="px-3 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={`${result.parameter}-${index}`} className="border-t border-border">
              <td className="px-3 py-2 text-foreground">{result.reason}</td>
              <td className="px-3 py-2 text-muted-foreground">{result.parameter}</td>
              <td className="px-3 py-2 text-right">{result.old_value}</td>
              <td className="px-3 py-2 text-right">{result.new_value}</td>
              <td className="px-3 py-2 text-right">+{result.expected_improvement}</td>
              <td className={`px-3 py-2 text-right ${result.actual_improvement > 0 ? 'text-green-400' : 'text-destructive'}`}>{result.actual_improvement > 0 ? '+' : ''}{result.actual_improvement}</td>
              <td className="px-3 py-2"><Badge variant="outline">{result.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function VisualAttentionMapLab() {
  const canvasRef = useRef(null);
  const candidateCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  const [map, setMap] = useState(null);
  const [candidateMap, setCandidateMap] = useState(null);
  const [candidateParams, setCandidateParams] = useState(DEFAULT_CANDIDATE_PARAMS);
  const [iterationResult, setIterationResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved).slice(-50));
  }, []);

  useEffect(() => {
    if (!map || !imageRef.current) return;
    drawOverlay(canvasRef.current, imageRef.current, map);
  }, [map]);

  useEffect(() => {
    if (!candidateMap || !iterationResult?.rendered_candidate) return;
    drawOverlay(candidateCanvasRef.current, iterationResult.rendered_candidate, candidateMap);
  }, [candidateMap, iterationResult]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setMap(null);
    setCandidateMap(null);
    setIterationResult(null);
    setCandidateParams(DEFAULT_CANDIDATE_PARAMS);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setMap(buildVisualAttentionMap(image));
    };
    image.onerror = () => setError('Image could not be loaded for optimization.');
    image.src = url;
  };

  const runIteration = () => {
    if (!imageRef.current || !map) return;
    const sourceMap = candidateMap || map;
    const result = runOneOptimizationIteration(imageRef.current, sourceMap, candidateParams);
    setIterationResult(result);
    setCandidateMap(result.final_map);
    setCandidateParams(result.final_params);
    const savedRows = result.action_results.map(row => ({ ...row, at: result.started_at, delta: result.total_delta }));
    const nextHistory = [...history, ...savedRows].slice(-50);
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const currentMap = candidateMap || map;
  const baseScore = currentMap ? posterImpactProxy(currentMap) : 0;
  const nextScore = iterationResult ? posterImpactProxy(iterationResult.final_map) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Cover Engine Optimizer Lab</h1>
            <Badge variant="destructive">Internal R&D</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Internal R&D only. Production covers are generated from AI Media Studio → Upload Video → Analyze Video → Covers → Generate Automatic Cover. This lab does not replace the production cover workflow.
          </p>
        </div>
        <div className="flex gap-2">
          <input id="attention-file" type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <Button asChild><label htmlFor="attention-file">Upload lab frame/cover</label></Button>
          <Button variant="outline" onClick={runIteration} disabled={!map}>Run iteration</Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {map ? (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <ScoreCard label="Candidate 1 Impact" value={baseScore} />
            <ScoreCard label="Candidate 2 Impact" value={nextScore ?? '—'} />
            <ScoreCard label="Delta" value={iterationResult ? `${iterationResult.total_delta > 0 ? '+' : ''}${iterationResult.total_delta}` : '—'} />
            <ScoreCard label="Accepted Actions" value={iterationResult?.action_results.filter(row => row.status === 'accepted').length ?? '—'} />
            <ScoreCard label="History Rows" value={history.length} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Candidate 1 Overlay</CardTitle></CardHeader>
              <CardContent>
                <canvas ref={canvasRef} className="h-auto w-full rounded-lg border border-border bg-black" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Candidate 2 Overlay</CardTitle></CardHeader>
              <CardContent>
                {candidateMap ? <canvas ref={candidateCanvasRef} className="h-auto w-full rounded-lg border border-border bg-black" /> : <div className="rounded-lg border border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">Run one iteration to generate Candidate 2.</div>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Executable Optimization Results</CardTitle></CardHeader>
            <CardContent>
              <ActionTable results={iterationResult?.action_results} />
              {!iterationResult && <p className="text-sm text-muted-foreground">Run an iteration to see reason, parameter changed, old value, new value, expected improvement, actual improvement and accept/revert status.</p>}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Current Candidate Parameters</CardTitle></CardHeader>
              <CardContent>
                <pre className="max-h-72 overflow-auto rounded-lg bg-black p-4 text-xs text-muted-foreground">{JSON.stringify(candidateParams, null, 2)}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Optimization History</CardTitle><Button variant="outline" size="sm" onClick={clearHistory}>Clear</Button></CardHeader>
              <CardContent>
                <pre className="max-h-72 overflow-auto rounded-lg bg-black p-4 text-xs text-muted-foreground">{JSON.stringify(history.slice(-12), null, 2)}</pre>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Upload a poster frame or existing cover to run a measurable optimization iteration.
          </CardContent>
        </Card>
      )}
    </div>
  );
}