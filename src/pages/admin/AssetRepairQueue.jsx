import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  RefreshCw, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileText,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AssetRepairQueue() {
  const queryClient = useQueryClient();
  const [auditResults, setAuditResults] = useState(null);
  const [queueResults, setQueueResults] = useState(null);
  const [dryRun, setDryRun] = useState(true);

  // Audit mutation
  const runAudit = useMutation({
    mutationFn: () => base44.functions.invoke('auditBrokenVideoAssets', {
      limit: 500,
      includePublished: true,
      includeDraft: true,
    }),
    onSuccess: (res) => {
      setAuditResults(res.data);
      queryClient.invalidateQueries({ queryKey: ['job-queue'] });
    },
  });

  // Queue mutation
  const queueRepairs = useMutation({
    mutationFn: () => base44.functions.invoke('queueBrokenAssetRepairs', {
      dryRun,
      maxJobs: 50,
      modes: ['thumbnail_only', 'preview_only', 'full_assets'],
      includePublished: true,
      includeDraft: true,
    }),
    onSuccess: (res) => {
      setQueueResults(res.data);
      if (!dryRun) {
        queryClient.invalidateQueries({ queryKey: ['job-queue'] });
      }
    },
  });

  // Load active jobs
  const { data: activeJobs = [] } = useQuery({
    queryKey: ['job-queue', 'active'],
    queryFn: () => base44.entities.JobQueue.filter({
      status: { $in: ['pending', 'running', 'callback_received', 'validating'] },
      entity_type: 'Video',
    }, '-created_date', 50),
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Repair Queue</h1>
          <p className="text-sm text-muted-foreground">
            PHASE 2C.3 — Batch repair broken video assets
          </p>
        </div>
        <Link to="/admin/videos">
          <Button variant="outline">← Back to Videos</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditResults ? auditResults.scanned : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {auditResults ? `${auditResults.healthy} healthy, ${auditResults.broken} broken` : 'Not run'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Queued (Last Run)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueResults ? queueResults.queued : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {queueResults ? `${queueResults.skipped} skipped` : 'Not run'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={dryRun ? "secondary" : "default"}>
              {dryRun ? "Dry Run" : "Live"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Dry Run (preview only, no jobs created)</span>
            </label>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => runAudit.mutate()}
              disabled={runAudit.isPending}
              className="gap-2"
            >
              {runAudit.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {runAudit.isPending ? 'Running Audit...' : 'Run Asset Audit'}
            </Button>
            <Button
              onClick={() => queueRepairs.mutate()}
              disabled={queueRepairs.isPending || !auditResults}
              variant={dryRun ? "outline" : "default"}
              className="gap-2"
            >
              {queueRepairs.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {queueRepairs.isPending ? 'Queueing...' : dryRun ? 'Dry Run Queue' : 'Queue Repairs (Live)'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['job-queue'] })}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Jobs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Results</TabsTrigger>
          <TabsTrigger value="queue">Queue Results</TabsTrigger>
          <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
        </TabsList>

        {/* Audit Results */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Asset Audit Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!auditResults ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Run audit to see results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 text-sm">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">
                      Healthy: {auditResults.healthy}
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600">
                      Broken: {auditResults.broken}
                    </Badge>
                    <Badge variant="outline">
                      Scanned: {auditResults.scanned}
                    </Badge>
                  </div>
                  <div className="max-h-[600px] overflow-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Video</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Thumbnail</TableHead>
                          <TableHead>Preview</TableHead>
                          <TableHead>Repair Mode</TableHead>
                          <TableHead>Can Repair?</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditResults.results.map((r) => (
                          <TableRow key={r.video_id}>
                            <TableCell className="font-medium">
                              <Link
                                to={`/admin/videos/${r.video_id}`}
                                className="hover:underline"
                              >
                                {r.title.substring(0, 50)}...
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.status === 'published' ? 'default' : 'secondary'}>
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <HealthBadge health={r.sourceHealth} />
                            </TableCell>
                            <TableCell>
                              <HealthBadge health={r.thumbnailHealth} />
                            </TableCell>
                            <TableCell>
                              <HealthBadge health={r.previewHealth} />
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.recommendedMode !== 'no_action' ? 'default' : 'outline'}>
                                {r.recommendedMode}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {r.canRepair ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Results */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Queue Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!queueResults ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Queue repairs to see results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 text-sm">
                    <Badge variant="default">Queued: {queueResults.queued}</Badge>
                    <Badge variant="secondary">Skipped: {queueResults.skipped}</Badge>
                    <Badge variant="outline">{queueResults.dryRun ? 'Dry Run' : 'Live'}</Badge>
                  </div>
                  {queueResults.jobs && queueResults.jobs.length > 0 && (
                    <div className="max-h-[600px] overflow-auto border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job ID</TableHead>
                            <TableHead>Video</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queueResults.jobs.map((job, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">
                                {job.job_id || 'N/A (dry run)'}
                              </TableCell>
                              <TableCell>
                                <Link
                                  to={`/admin/videos/${job.video_id}`}
                                  className="hover:underline"
                                >
                                  {job.title.substring(0, 40)}...
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge>{job.mode}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">{job.reason}</TableCell>
                              <TableCell>
                                <Badge variant={job.status === 'pending' ? 'default' : 'secondary'}>
                                  {job.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Jobs */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Active Repair Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p>No active jobs</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">{job.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.job_type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {job.entity_type}: {job.entity_id}
                          </TableCell>
                          <TableCell>
                            <JobStatusBadge status={job.status} />
                          </TableCell>
                          <TableCell>{job.priority}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(job.created_date).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HealthBadge({ health }) {
  const variants = {
    canonical_healthy: 'bg-green-500/10 text-green-600',
    legacy_healthy: 'bg-yellow-500/10 text-yellow-600',
    source_missing: 'bg-red-500/10 text-red-600',
    source_404: 'bg-red-500/10 text-red-600',
    source_invalid: 'bg-red-500/10 text-red-600',
    thumbnail_missing: 'bg-red-500/10 text-red-600',
    thumbnail_corrupt: 'bg-red-500/10 text-red-600',
    thumbnail_404: 'bg-red-500/10 text-red-600',
    preview_missing: 'bg-red-500/10 text-red-600',
    preview_404: 'bg-red-500/10 text-red-600',
    preview_invalid: 'bg-red-500/10 text-red-600',
  };

  return (
    <Badge variant="outline" className={variants[health] || ''}>
      {health}
    </Badge>
  );
}

function JobStatusBadge({ status }) {
  const variants = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    running: 'bg-blue-500/10 text-blue-600',
    callback_received: 'bg-purple-500/10 text-purple-600',
    validating: 'bg-orange-500/10 text-orange-600',
    completed: 'bg-green-500/10 text-green-600',
    failed: 'bg-red-500/10 text-red-600',
  };

  return (
    <Badge variant="outline" className={variants[status] || ''}>
      {status}
    </Badge>
  );
}