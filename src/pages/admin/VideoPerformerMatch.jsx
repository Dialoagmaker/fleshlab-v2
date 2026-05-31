import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Film, X, Save, SkipForward, Search, Image, CheckCircle2, AlertCircle, Loader2, Keyboard } from "lucide-react";

function VideoPreviewCard({ video, brands = [] }) {
  const brand = brands.find(b => b.id === video.brand_id);
  const getPreviewUrl = () => {
    if (video.trailer_url?.trim()) return video.trailer_url;
    if (video.source_video_url?.trim()) return video.source_video_url;
    if (video.src_url?.trim()) return video.src_url;
    if (video.full_video_url?.trim()) return video.full_video_url;
    return null;
  };
  const previewUrl = getPreviewUrl();
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="aspect-video bg-secondary rounded-lg overflow-hidden border border-border relative">
          {video.primary_thumbnail_url ? (<img src={video.primary_thumbnail_url} alt={video.title} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-muted-foreground"><Film className="w-8 h-8 opacity-50" /></div>)}
        </div>
        <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border">
          {previewUrl ? (<video src={previewUrl} controls className="w-full h-full" preload="metadata" />) : (<div className="w-full h-full flex items-center justify-center text-muted-foreground"><Play className="w-8 h-8 opacity-50" /></div>)}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-foreground leading-snug">{video.title}</h3>
        <div className="flex flex-wrap gap-2 items-center">
          {brand && (<Badge variant="secondary" className="px-2 py-0.5 text-xs">{brand.name}</Badge>)}
          <Badge className={`text-xs px-2 py-0.5 ${video.status === 'published' ? 'bg-green-500/10 text-green-500' : video.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>{video.status}</Badge>
          {video.duration_seconds && (<span className="text-xs text-muted-foreground">{Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}</span>)}
        </div>
      </div>
    </div>
  );
}

function PerformerCard({ performer, isSelected, onToggle, shortcut }) {
  return (
    <div className={`relative border rounded-lg p-3 cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card hover:border-primary/50"}`} onClick={onToggle}>
      {shortcut && (<div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">{shortcut}</div>)}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {performer.profile_image_url ? (<img src={performer.profile_image_url} alt={performer.display_name} className="w-16 h-16 rounded-full object-cover border-2 border-border" />) : (<div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border"><Image className="w-8 h-8 text-muted-foreground" /></div>)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Checkbox checked={isSelected} onCheckedChange={onToggle} />
            <h4 className="font-semibold text-sm text-foreground truncate">{performer.display_name}</h4>
          </div>
          {performer.stage_name && performer.stage_name !== performer.display_name && (<p className="text-xs text-muted-foreground mb-1">aka {performer.stage_name}</p>)}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {performer.nationality && (<span>{performer.nationality}</span>)}
            {performer.video_count !== undefined && (<span>• {performer.video_count} videos</span>)}
          </div>
          <div className="flex gap-1 mt-2">
            {performer.verified && (<Badge variant="outline" className="text-xs px-1.5 py-0.5">✓ Verified</Badge>)}
            {performer.fanclub_enabled && (<Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-500">Fanclub</Badge>)}
          </div>
        </div>
      </div>
      {performer._aiSuggestionScore && performer._aiSuggestionScore > 0.5 && (
        <div className="absolute bottom-0 left-0 right-0 right-0 bg-gradient-to-t from-primary/10 to-transparent p-2 rounded-b-lg">
          <div className="flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 className="w-3 h-3" />
            <span>Match: {Math.round(performer._aiSuggestionScore * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function suggestPerformers(video, performers, brands) {
  if (!video || !performers || performers.length === 0) return [];
  const suggestions = [];
  const videoText = `${video.title} ${video.description || ''} ${video.tags?.join(' ') || ''}`.toLowerCase();
  for (const performer of performers) {
    let score = 0;
    const performerNames = [performer.display_name?.toLowerCase(), performer.stage_name?.toLowerCase()].filter(Boolean);
    for (const name of performerNames) { if (videoText.includes(name)) { score += 0.4; break; } }
    for (const name of performerNames) { if (video.tags?.some(t => t.toLowerCase().includes(name))) { score += 0.3; break; } }
    if (performer.brand_id && performer.brand_id === video.brand_id) { score += 0.2; }
    if (performer.nationality && videoText.includes(performer.nationality.toLowerCase())) { score += 0.15; }
    if (performer.featured) { score += 0.05; }
    if (score > 0) { suggestions.push({ ...performer, _aiSuggestionScore: Math.min(score, 1.0) }); }
  }
  return suggestions.sort((a, b) => b._aiSuggestionScore - a._aiSuggestionScore);
}

export default function VideoPerformerMatch() {
  const queryClient = useQueryClient();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [selectedPerformerIds, setSelectedPerformerIds] = useState([]);
  const [filterMode, setFilterMode] = useState("unassigned");
  const [filterBrand, setFilterBrand] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [performerSearch, setPerformerSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { data: videos = [], isLoading: videosLoading } = useQuery({ queryKey: ["match-videos"], queryFn: () => base44.entities.Video.list("-created_date", 200) });
  const { data: brands = [] } = useQuery({ queryKey: ["match-brands"], queryFn: () => base44.entities.Brand.filter({ status: "active" }) });
  const { data: allPerformers = [] } = useQuery({ queryKey: ["match-performers"], queryFn: () => base44.entities.Performer.filter({ status: "active" }, "display_name", 200) });
  const { data: videoPerformers = [] } = useQuery({ queryKey: ["all-video-performers"], queryFn: () => base44.entities.VideoPerformer.filter({}) });

  const filteredVideos = React.useMemo(() => {
    let filtered = [...videos];
    const assignmentMap = new Map();
    videoPerformers.forEach(vp => { if (!assignmentMap.has(vp.video_id)) assignmentMap.set(vp.video_id, []); assignmentMap.get(vp.video_id).push(vp.performer_id); });
    if (filterMode === "unassigned") filtered = filtered.filter(v => !assignmentMap.has(v.id) || assignmentMap.get(v.id).length === 0);
    if (filterMode === "by_brand" && filterBrand) filtered = filtered.filter(v => v.brand_id === filterBrand);
    if (searchQuery) { const query = searchQuery.toLowerCase(); filtered = filtered.filter(v => v.title?.toLowerCase().includes(query) || v.description?.toLowerCase().includes(query)); }
    return filtered;
  }, [videos, videoPerformers, filterMode, filterBrand, searchQuery]);

  const currentVideo = filteredVideos[currentVideoIndex];
  const currentAssignments = React.useMemo(() => { if (!currentVideo) return []; return videoPerformers.filter(vp => vp.video_id === currentVideo.id).map(vp => vp.performer_id); }, [currentVideo, videoPerformers]);

  useEffect(() => { setSelectedPerformerIds(currentAssignments.length > 0 ? currentAssignments : []); }, [currentVideo?.id]);

  const suggestedPerformerIds = React.useMemo(() => { if (!currentVideo) return []; const suggestions = suggestPerformers(currentVideo, allPerformers, brands); return suggestions.filter(s => s._aiSuggestionScore > 0.5).map(s => s.id); }, [currentVideo, allPerformers, brands]);

  const filteredPerformers = React.useMemo(() => { if (!performerSearch.trim()) return allPerformers; const query = performerSearch.toLowerCase(); return allPerformers.filter(p => p.display_name?.toLowerCase().includes(query) || p.stage_name?.toLowerCase().includes(query) || p.nationality?.toLowerCase().includes(query)); }, [allPerformers, performerSearch]);

  const saveMutation = useMutation({
    mutationFn: async ({ videoId, newPerformerIds, oldPerformerIds }) => {
      const toAdd = newPerformerIds.filter(id => !oldPerformerIds.includes(id));
      const toRemove = oldPerformerIds.filter(id => !newPerformerIds.includes(id));
      for (const performerId of toRemove) { const vp = videoPerformers.find(vp => vp.video_id === videoId && vp.performer_id === performerId); if (vp) await base44.entities.VideoPerformer.delete(vp.id); }
      for (const performerId of toAdd) { await base44.entities.VideoPerformer.create({ video_id: videoId, performer_id: performerId, order: 0 }); }
      return { added: toAdd.length, removed: toRemove.length };
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["all-video-performers"] }); queryClient.invalidateQueries({ queryKey: ["match-videos"] }); },
  });

  const handleSaveAndNext = async () => { if (!currentVideo) return; setIsSaving(true); try { await saveMutation.mutateAsync({ videoId: currentVideo.id, newPerformerIds: selectedPerformerIds, oldPerformerIds: currentAssignments }); if (currentVideoIndex < filteredVideos.length - 1) { setCurrentVideoIndex(prev => prev + 1); setSelectedPerformerIds([]); } } finally { setIsSaving(false); } };
  const handleSkip = () => { if (currentVideoIndex < filteredVideos.length - 1) { setCurrentVideoIndex(prev => prev + 1); setSelectedPerformerIds([]); } };
  const togglePerformer = (performerId) => { setSelectedPerformerIds(prev => prev.includes(performerId) ? prev.filter(id => id !== performerId) : [...prev, performerId]); };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key >= '1' && e.key <= '9') { const index = parseInt(e.key) - 1; const visible = filteredPerformers.slice(0, 9); if (visible[index]) togglePerformer(visible[index].id); }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveAndNext(); }
      if (e.key === 's' || e.key === 'S') handleSkip();
      if (e.key === 'Escape') setSelectedPerformerIds([]);
      if (e.key === '?' || (e.shiftKey && e.key === '/')) setShowShortcuts(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideo, selectedPerformerIds, filteredPerformers, currentVideoIndex]);

  const totalUnassigned = filteredVideos.filter(v => !videoPerformers.some(vp => vp.video_id === v.id)).length;
  if (videosLoading) return (<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quick Match: Video to Performers</h1>
          <p className="text-muted-foreground text-sm mt-1">Fast assignment tool - {filteredVideos.length} videos - {totalUnassigned} unassigned</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowShortcuts(!showShortcuts)} className="gap-2"><Keyboard className="w-4 h-4" />Shortcuts</Button>
      </div>

      {showShortcuts && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Keyboard className="w-4 h-4" />Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2"><Badge variant="outline" className="font-mono">1-9</Badge><span>Select performer</span></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className="font-mono">Enter</Badge><span>Save and Next</span></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className="font-mono">S</Badge><span>Skip</span></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className="font-mono">Esc</Badge><span>Clear selection</span></div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Filter Mode</Label>
            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned Only</SelectItem>
                <SelectItem value="all">All Videos</SelectItem>
                <SelectItem value="by_brand">By Brand</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filterMode === "by_brand" && (
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger><SelectValue placeholder="Select brand..." /></SelectTrigger>
                <SelectContent>{brands.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>Search by Title</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search videos..." className="pl-10" />
            </div>
          </div>
        </div>
      </div>

      {!currentVideo ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">All Done!</h3>
          <p className="text-muted-foreground">{filterMode === "unassigned" ? "No more unassigned videos. Change filter to see all videos." : "No videos match your current filters."}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <VideoPreviewCard video={currentVideo} brands={brands} />
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{currentVideoIndex + 1} / {filteredVideos.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentVideoIndex + 1) / filteredVideos.length) * 100}%` }} /></div>
            </div>
            {currentAssignments.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Currently Assigned ({currentAssignments.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {currentAssignments.map(performerId => { const performer = allPerformers.find(p => p.id === performerId); return (<Badge key={performerId} variant="secondary" className="gap-2">{performer?.profile_image_url && (<img src={performer.profile_image_url} alt={performer.display_name} className="w-5 h-5 rounded-full object-cover" />)}{performer?.display_name || performerId}</Badge>); })}
                </div>
              </div>
            )}
            {suggestedPerformerIds.length > 0 && (
              <div className="bg-card border border-primary/30 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary"><CheckCircle2 className="w-4 h-4" />AI Suggestions ({suggestedPerformerIds.length})</h3>
                <p className="text-xs text-muted-foreground mb-3">Based on title, description, tags, and brand matching</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPerformerIds.map(performerId => { const performer = allPerformers.find(p => p.id === performerId); return (<Button key={performerId} variant="outline" size="sm" onClick={() => togglePerformer(performerId)} className={selectedPerformerIds.includes(performerId) ? "bg-primary text-primary-foreground" : ""}>{performer?.display_name}</Button>); })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Performers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={performerSearch} onChange={(e) => setPerformerSearch(e.target.value)} placeholder="Search by name, stage name, or nationality..." className="pl-10" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Performers ({selectedPerformerIds.length} selected)</Label>
              {selectedPerformerIds.length > 0 && (<Button variant="ghost" size="sm" onClick={() => setSelectedPerformerIds([])} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3 mr-1" />Clear</Button>)}
            </div>
            <ScrollArea className="h-[600px] border border-border rounded-xl p-4 bg-card">
              <div className="grid gap-3">
                {filteredPerformers.slice(0, 50).map((performer, idx) => (<PerformerCard key={performer.id} performer={performer} isSelected={selectedPerformerIds.includes(performer.id)} onToggle={() => togglePerformer(performer.id)} shortcut={idx < 9 ? idx + 1 : null} />))}
                {filteredPerformers.length === 0 && (<div className="text-center py-12 text-muted-foreground"><Image className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No performers found</p></div>)}
              </div>
            </ScrollArea>
            <div className="flex gap-3">
              <Button onClick={handleSaveAndNext} disabled={isSaving || selectedPerformerIds.length === 0} className="flex-1 gap-2 bg-primary hover:bg-primary/90">
                {isSaving ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Save className="w-4 h-4" />)}
                {isSaving ? "Saving..." : "Save and Next"}
              </Button>
              <Button onClick={handleSkip} variant="outline" className="gap-2"><SkipForward className="w-4 h-4" />Skip</Button>
            </div>
            {saveMutation.isError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Error saving: {saveMutation.error.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}