import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Copy, Check, Sparkles, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";

const BRANDS = [
  "FLESHLAB Studios",
  "PinkBoys Studios",
  "FLESHLAB Asia",
  "RentAGay Productions",
  "THE-FITMASTER",
];

const ACCESS_TIERS = [
  { value: "free", label: "Free" },
  { value: "preview", label: "Preview" },
  { value: "ppv", label: "PPV" },
  { value: "fanclub", label: "Fanclub" },
];

export default function AITextGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    raw_idea: "",
    current_title: "",
    current_description: "",
    brand: "",
    categories: "",
    tags: "",
    performer_info: "",
    access_tier: "",
  });

  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState({ title: false, description: false });

  const handleGenerate = async () => {
    if (!formData.raw_idea.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter a rough idea or scene notes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGenerated(null);

    try {
      const payload = {
        ...formData,
        categories: formData.categories ? formData.categories.split(',').map(s => s.trim()).filter(Boolean) : [],
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      };

      const response = await base44.functions.invoke('generateVideoTextFromIdea', payload);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setGenerated(response.data);

      // Show taxonomy warnings inline (no browser popup)
      if (response.data.taxonomy_warnings && response.data.taxonomy_warnings.length > 0) {
        toast({
          title: "Metadata Cleaned",
          description: `${response.data.taxonomy_warnings.length} invalid taxonomy item(s) removed`,
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Title and description generated",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, field) => {
    await navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [field]: true }));
    
    toast({
      title: "Copied",
      description: `${field} copied to clipboard`,
    });

    setTimeout(() => {
      setCopied(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  const handleCopyBoth = async () => {
    if (!generated) return;
    
    const combined = `TITLE: ${generated.title}\n\nDESCRIPTION: ${generated.description}`;
    await navigator.clipboard.writeText(combined);
    
    toast({
      title: "Copied Both",
      description: "Title and description copied to clipboard",
    });
  };

  const handleClear = () => {
    setFormData({
      raw_idea: "",
      current_title: "",
      current_description: "",
      brand: "",
      categories: "",
      tags: "",
      performer_info: "",
      access_tier: "",
    });
    setGenerated(null);
    setCopied({ title: false, description: false });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">AI Video Title & Description Generator</h1>
        <p className="text-muted-foreground">
          Enter rough scene notes, a draft title, tags, or content ideas. The AI will generate an SEO-friendly FLESHLAB title and description.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Scene Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Raw Idea - Required */}
          <div className="space-y-2">
            <Label htmlFor="raw_idea">Raw Idea / Notes *</Label>
            <Textarea
              id="raw_idea"
              value={formData.raw_idea}
              onChange={(e) => updateField('raw_idea', e.target.value)}
              placeholder="Example: Filipino twink jerks off outside in the jungle, nervous, amateur solo, risk of being discovered"
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Optional Current Title */}
          <div className="space-y-2">
            <Label htmlFor="current_title">Optional Current Title</Label>
            <Input
              id="current_title"
              value={formData.current_title}
              onChange={(e) => updateField('current_title', e.target.value)}
              placeholder="Existing working title..."
            />
          </div>

          {/* Optional Current Description */}
          <div className="space-y-2">
            <Label htmlFor="current_description">Optional Existing Description</Label>
            <Textarea
              id="current_description"
              value={formData.current_description}
              onChange={(e) => updateField('current_description', e.target.value)}
              placeholder="Existing description to improve..."
              rows={3}
            />
          </div>

          {/* Brand / Studio */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand / Studio</Label>
            <Select value={formData.brand} onValueChange={(v) => updateField('brand', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {BRANDS.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label htmlFor="categories">Categories (comma-separated)</Label>
            <Input
              id="categories"
              value={formData.categories}
              onChange={(e) => updateField('categories', e.target.value)}
              placeholder="e.g. Solo, Asian, Outdoor, Filipino"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => updateField('tags', e.target.value)}
              placeholder="e.g. twink, masturbation, jungle, amateur"
            />
          </div>

          {/* Performer Info */}
          <div className="space-y-2">
            <Label htmlFor="performer_info">Performer Type / Notes</Label>
            <Input
              id="performer_info"
              value={formData.performer_info}
              onChange={(e) => updateField('performer_info', e.target.value)}
              placeholder="e.g. Filipino twink, slim Asian boy, fit Asian performer"
            />
          </div>

          {/* Access Tier */}
          <div className="space-y-2">
            <Label htmlFor="access_tier">Access Tier</Label>
            <Select value={formData.access_tier} onValueChange={(v) => updateField('access_tier', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select tier..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Not specified</SelectItem>
                {ACCESS_TIERS.map(tier => (
                  <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Title & Description
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              disabled={loading}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Output */}
      {generated && (
        <div className="space-y-4">
          {/* Taxonomy Warnings - Inline (No Browser Popup) */}
          {(generated.taxonomy_warnings && generated.taxonomy_warnings.length > 0) || (generated.taxonomy_removed && generated.taxonomy_removed.length > 0) ? (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="text-sm font-semibold text-yellow-800 mb-2">
                  Invalid Taxonomy Items Removed:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                  {generated.taxonomy_warnings?.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                  {generated.taxonomy_removed?.map((item, i) => (
                    <li key={i}>
                      "{item.value}" → {item.reason === 'parent_group_label' ? 'parent group label (not selectable)' : item.reason}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-yellow-600 mt-3">
                  ✓ Cleaned metadata applied. You can safely save without additional confirmation.
                </p>
              </AlertDescription>
            </Alert>
          ) : null}
          
          {/* Other Warnings */}
          {generated.warnings && generated.warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {generated.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Generated Title */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Generated Title</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(generated.title, 'title')}
                  className="h-8"
                >
                  {copied.title ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Input 
                value={generated.title} 
                onChange={(e) => setGenerated(prev => ({ ...prev, title: e.target.value }))}
                className="font-semibold"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {generated.title.length} characters
              </p>
            </CardContent>
          </Card>

          {/* Generated Description */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Generated Description</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(generated.description, 'description')}
                className="h-8"
              >
                {copied.description ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={generated.description} 
                onChange={(e) => setGenerated(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {generated.description.length} characters
              </p>
            </CardContent>
          </Card>

          {/* SEO Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">SEO Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">SEO Title ({generated.seo_title?.length || 0}/60)</Label>
                <Input 
                  value={generated.seo_title || ''} 
                  onChange={(e) => setGenerated(prev => ({ ...prev, seo_title: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">SEO Description ({generated.seo_description?.length || 0}/158)</Label>
                <Textarea 
                  value={generated.seo_description || ''} 
                  onChange={(e) => setGenerated(prev => ({ ...prev, seo_description: e.target.value }))}
                  rows={2}
                  className="text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags & Categories */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Suggested Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(generated.tags || []).map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Suggested Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(generated.suggested_categories || []).map((cat, i) => (
                    <Badge key={i} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleCopyBoth} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Both
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGenerate} 
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Again
            </Button>
          </div>

          {/* Raw JSON Debug */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">
                Show Raw JSON Response
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <pre className="text-[10px] font-mono bg-muted/50 p-3 rounded overflow-auto max-h-96">
                    {JSON.stringify(generated.raw_response, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}