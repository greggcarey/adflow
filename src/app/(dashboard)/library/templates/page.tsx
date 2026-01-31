"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, Image as ImageIcon } from "lucide-react";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateUploadDialog } from "@/components/templates/template-upload-dialog";

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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<AdTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [hookType, setHookType] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [format, platform, hookType]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (format && format !== "all") params.set("format", format);
      if (platform && platform !== "all") params.set("platform", platform);
      if (hookType && hookType !== "all") params.set("hookType", hookType);
      if (search) params.set("search", search);

      const res = await fetch(`/api/templates?${params.toString()}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    fetchTemplates();
  }

  function handleTemplateCreated(template: AdTemplate) {
    setTemplates((prev) => [template, ...prev]);
  }

  function handleTemplateDeleted(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function handleTemplateUpdated(updated: AdTemplate) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  }

  const filteredTemplates = search
    ? templates.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      )
    : templates;

  return (
    <>
      <Header
        title="Ad Templates"
        description="Your library of reference ads with AI-extracted insights"
      >
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </Header>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={hookType} onValueChange={setHookType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Hook Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hook Types</SelectItem>
              {HOOK_TYPES.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No templates yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Upload your first ad template to get started
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={handleTemplateDeleted}
                onUpdate={handleTemplateUpdated}
              />
            ))}
          </div>
        )}
      </div>

      <TemplateUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onTemplateCreated={handleTemplateCreated}
      />
    </>
  );
}
