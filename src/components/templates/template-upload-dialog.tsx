"use client";

import { useState, useCallback } from "react";
import { upload } from "@vercel/blob/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  X,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { toast } from "sonner";

interface AdTemplate {
  id: string;
  name: string;
  sourceType: string;
  sourceUrl: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  fileType: string;
  format: string;
  platform: string;
  hookType: string;
  visualStyle: {
    primaryColors: string[];
    aesthetic: string;
    mood: string;
    hasText: boolean;
    hasFaces: boolean;
    hasProduct: boolean;
  };
  keyFeatures: string[];
  tags: string[];
  notes: string | null;
  isFavorite: boolean;
  createdAt: string;
}

interface TemplateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateCreated: (template: AdTemplate) => void;
}

type Step = "upload" | "analyzing" | "review";

const FORMATS = [
  "UGC Testimonial",
  "Product Demo",
  "Before/After",
  "Problem-Solution",
  "Unboxing",
  "Tutorial",
  "Lifestyle",
  "Talking Head",
  "Slideshow",
  "Animation",
];

const PLATFORMS = ["Meta", "TikTok", "YouTube", "Instagram", "Pinterest"];

const HOOK_TYPES = [
  "Question",
  "Statement",
  "Controversial",
  "Curiosity",
  "Pain Point",
  "Social Proof",
  "Statistic",
];

export function TemplateUploadDialog({
  open,
  onOpenChange,
  onTemplateCreated,
}: TemplateUploadDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    type: "image" | "video";
    mimeType: string;
    size: number;
  } | null>(null);

  const [urlInput, setUrlInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    format: "",
    platform: "",
    hookType: "",
    notes: "",
    tags: [] as string[],
  });

  const [analysis, setAnalysis] = useState<{
    suggestedName: string;
    format: string;
    platform: string;
    hookType: string;
    visualStyle: Record<string, unknown>;
    keyFeatures: string[];
    confidence: number;
  } | null>(null);

  const [tagInput, setTagInput] = useState("");

  const resetState = useCallback(() => {
    setStep("upload");
    setUploadProgress(0);
    setUploading(false);
    setAnalyzing(false);
    setSaving(false);
    setUploadedFile(null);
    setUrlInput("");
    setFormData({
      name: "",
      format: "",
      platform: "",
      hookType: "",
      notes: "",
      tags: [],
    });
    setAnalysis(null);
    setTagInput("");
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please upload an image or video file");
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/templates/upload",
        onUploadProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });

      setUploadedFile({
        url: blob.url,
        type: isImage ? "image" : "video",
        mimeType: file.type,
        size: file.size,
      });

      // Trigger AI analysis
      await analyzeAd(blob.url, isImage ? "image" : "video");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
      setUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    // Validate URL
    try {
      new URL(urlInput);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setUploading(true);

    try {
      // For URLs, we'll pass it to the analyze endpoint which will fetch the image
      await analyzeAd(urlInput, "image", true);

      setUploadedFile({
        url: urlInput,
        type: "image",
        mimeType: "image/unknown",
        size: 0,
      });
    } catch (error) {
      console.error("URL analysis error:", error);
      toast.error("Failed to analyze URL");
      setUploading(false);
    }
  };

  const analyzeAd = async (
    url: string,
    fileType: "image" | "video",
    isExternalUrl = false
  ) => {
    setStep("analyzing");
    setAnalyzing(true);

    try {
      const body = isExternalUrl
        ? { imageUrl: url }
        : { imageUrl: url };

      const res = await fetch("/api/ai/analyze-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Analysis failed");
      }

      const analysisResult = await res.json();
      setAnalysis(analysisResult);

      // Pre-fill form with AI suggestions
      setFormData({
        name: analysisResult.suggestedName || "",
        format: analysisResult.format || "",
        platform: analysisResult.platform || "",
        hookType: analysisResult.hookType || "",
        notes: "",
        tags: [],
      });

      setStep("review");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze ad");
      setStep("upload");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.format || !formData.platform || !formData.hookType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        sourceType: uploadedFile?.url.startsWith("http") && !uploadedFile.url.includes("vercel")
          ? "url"
          : "upload",
        sourceUrl: urlInput || null,
        fileUrl: uploadedFile?.url || null,
        thumbnailUrl: uploadedFile?.type === "image" ? uploadedFile.url : null,
        fileType: uploadedFile?.type || "image",
        fileMimeType: uploadedFile?.mimeType,
        fileSize: uploadedFile?.size,
        format: formData.format,
        platform: formData.platform,
        hookType: formData.hookType,
        visualStyle: analysis?.visualStyle || {},
        keyFeatures: analysis?.keyFeatures || [],
        aiAnalysis: analysis || {},
        notes: formData.notes || null,
        tags: formData.tags,
      };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save template");
      }

      const template = await res.json();
      toast.success("Template saved successfully");
      onTemplateCreated(template);
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetState();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Add Ad Template"}
            {step === "analyzing" && "Analyzing Ad"}
            {step === "review" && "Review Template"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload an ad image/video or paste a URL"}
            {step === "analyzing" && "Our AI is extracting key features..."}
            {step === "review" && "Review and edit the AI-extracted information"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <Tabs defaultValue="upload" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="mr-2 h-4 w-4" />
                Paste URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images (PNG, JPG, GIF, WebP) or Videos (MP4, MOV, WebM)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 50MB
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>

              {uploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Image URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/ad-image.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a direct link to an ad image
                  </p>
                </div>

                <Button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim() || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze URL
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Analyzing your ad...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Extracting format, style, and key features
            </p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4 mt-4">
            {/* Preview */}
            {uploadedFile && (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {uploadedFile.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadedFile.url}
                    alt="Ad preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Video uploaded</span>
                  </div>
                )}
              </div>
            )}

            {/* AI Confidence */}
            {analysis && (
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">AI Confidence:</span>
                <Badge variant="secondary">
                  {Math.round((analysis.confidence || 0.7) * 100)}%
                </Badge>
              </div>
            )}

            {/* Form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format *</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) =>
                    setFormData({ ...formData, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({ ...formData, platform: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hookType">Hook Type *</Label>
                <Select
                  value={formData.hookType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, hookType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hook type" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOOK_TYPES.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any additional notes about this template..."
                  rows={2}
                />
              </div>
            </div>

            {/* Key Features */}
            {analysis?.keyFeatures && analysis.keyFeatures.length > 0 && (
              <div className="space-y-2">
                <Label>AI-Detected Key Features</Label>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyFeatures.map((feature, i) => (
                    <Badge key={i} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetState();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Template"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
