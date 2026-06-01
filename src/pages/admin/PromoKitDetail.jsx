import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Copy, RefreshCw, Check, Globe, ExternalLink, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

export default function PromoKitDetail() {
  const { video_id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState(null);

  const { data: video } = useQuery({
    queryKey: ['video', video_id],
    queryFn: () => base44.entities.Video.get(video_id),
  });

  const { data: promoKits } = useQuery({
    queryKey: ['promo-kits', video_id],
    queryFn: () => base44.entities.VideoPromoKit.filter({ video_id }, '-generated_at', 1),
  });

  const latestKit = promoKits?.[0];

  const generateKit = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generatePromoKit', { video_id, kit_type: 'full' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-kits', video_id] });
      queryClient.invalidateQueries({ queryKey: ['video', video_id] });
      toast.success('Promo kit generated successfully');
    },
  });

  const markPosted = useMutation({
    mutationFn: async ({ platform }) => {
      const field = `${platform}_posted_at`;
      await base44.entities.Video.update(video_id, { [field]: new Date().toISOString() });
      
      // Update promotion_status if needed
      const currentVideo = await base44.entities.Video.get(video_id);
      if (currentVideo.promotion_status === 'none') {
        await base44.entities.Video.update(video_id, { promotion_status: 'active' });
      }
      
      return platform;
    },
    onSuccess: (platform) => {
      queryClient.invalidateQueries({ queryKey: ['video', video_id] });
      toast.success(`Marked as posted on ${platform}`);
    },
  });

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  if (!video) {
    return <div className="text-center py-16 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/content-review')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Promo Kit</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{video.title}</p>
        </div>
        <Button onClick={() => generateKit.mutate()} disabled={generateKit.isPending} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${generateKit.isPending ? 'animate-spin' : ''}`} />
          {generateKit.isPending ? 'Generating…' : 'Regenerate Kit'}
        </Button>
      </div>

      {/* Alert if no kit exists */}
      {!latestKit && (
        <Alert>
          <AlertDescription>
            No promo kit generated yet. Click "Regenerate Kit" to create one.
          </AlertDescription>
        </Alert>
      )}

      {latestKit && (
        <div className="grid gap-6">
          {/* Website Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website Publishing Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label>Title</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-foreground flex-1">{video.title}</p>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(video.title, 'title')}>
                    {copiedField === 'title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="flex items-start gap-2 mt-1">
                  <p className="text-foreground flex-1">{video.description || '—'}</p>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(video.description || '', 'desc')}>
                    {copiedField === 'desc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Access Tier</Label>
                  <p className="text-foreground mt-1">{video.access_tier}</p>
                </div>
                <div>
                  <Label>Published At</Label>
                  <p className="text-foreground mt-1">{video.website_published_at ? new Date(video.website_published_at).toLocaleDateString() : 'Not published'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* xHamster Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                xHamster Publishing Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label>xHamster Title</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-foreground flex-1">{latestKit.xhamster_title}</p>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(latestKit.xhamster_title, 'xh_title')}>
                    {copiedField === 'xh_title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>xHamster Description</Label>
                <div className="flex items-start gap-2 mt-1">
                  <p className="text-foreground flex-1">{latestKit.xhamster_description}</p>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(latestKit.xhamster_description, 'xh_desc')}>
                    {copiedField === 'xh_desc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>xHamster Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {latestKit.xhamster_tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              {latestKit.xhamster_upload_notes && (
                <div>
                  <Label>Upload Notes</Label>
                  <p className="text-foreground mt-1">{latestKit.xhamster_upload_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Social Media Captions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <Label>Short Caption (X/Twitter)</Label>
                <div className="flex items-start gap-2 mt-1">
                  <Textarea value={latestKit.social_short_caption} readOnly className="h-20 flex-1" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(latestKit.social_short_caption, 'short')}>
                    {copiedField === 'short' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Long Caption (Reddit/Telegram)</Label>
                <div className="flex items-start gap-2 mt-1">
                  <Textarea value={latestKit.social_long_caption} readOnly className="h-20 flex-1" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(latestKit.social_long_caption, 'long')}>
                    {copiedField === 'long' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              {latestKit.hashtags?.length > 0 && (
                <div>
                  <Label>Hashtags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {latestKit.hashtags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {latestKit.cta_text && (
                <div>
                  <Label>CTA Text</Label>
                  <p className="text-foreground mt-1">{latestKit.cta_text}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Asset Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {latestKit.cover_url && (
                <div className="flex items-center justify-between">
                  <Label>Cover Image</Label>
                  <a href={latestKit.cover_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {latestKit.thumbnail_url && (
                <div className="flex items-center justify-between">
                  <Label>Thumbnail</Label>
                  <a href={latestKit.thumbnail_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {latestKit.preview_url && (
                <div className="flex items-center justify-between">
                  <Label>Preview Video</Label>
                  <a href={latestKit.preview_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mark as Posted Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Mark as Posted</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markPosted.mutate({ platform: 'xhamster' })}
                  disabled={markPosted.isPending}
                  className="border-blue-500/30 text-blue-400"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  xHamster {video.xhamster_posted_at && '✓'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markPosted.mutate({ platform: 'twitter' })}
                  disabled={markPosted.isPending}
                  className="border-sky-500/30 text-sky-400"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Twitter {video.twitter_posted_at && '✓'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markPosted.mutate({ platform: 'reddit' })}
                  disabled={markPosted.isPending}
                  className="border-orange-500/30 text-orange-400"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Reddit {video.reddit_posted_at && '✓'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markPosted.mutate({ platform: 'telegram' })}
                  disabled={markPosted.isPending}
                  className="border-cyan-500/30 text-cyan-400"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Telegram {video.telegram_posted_at && '✓'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}