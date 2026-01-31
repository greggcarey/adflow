"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical,
  Heart,
  Trash2,
  ExternalLink,
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

interface TemplateCardProps {
  template: AdTemplate;
  onDelete: (id: string) => void;
  onUpdate: (template: AdTemplate) => void;
}

export function TemplateCard({ template, onDelete, onUpdate }: TemplateCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleFavorite = async () => {
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !template.isFavorite }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();
      onUpdate(updated);
    } catch (error) {
      toast.error("Failed to update template");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Template deleted");
      onDelete(template.id);
    } catch (error) {
      toast.error("Failed to delete template");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const imageUrl = template.thumbnailUrl || template.fileUrl;

  return (
    <>
      <Card className="overflow-hidden group">
        {/* Image/Video Preview */}
        <div className="aspect-video bg-muted relative overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={template.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {template.fileType === "video" ? (
                <Video className="h-12 w-12 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Video indicator */}
          {template.fileType === "video" && imageUrl && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-black/60 text-white">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            </div>
          )}

          {/* Favorite button overlay */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${
                template.isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-white"
              }`}
            />
          </button>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{template.name}</h3>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="text-xs">
                  {template.format}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.platform}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {template.sourceUrl && (
                  <DropdownMenuItem asChild>
                    <a
                      href={template.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Source
                    </a>
                  </DropdownMenuItem>
                )}
                {template.fileUrl && (
                  <DropdownMenuItem asChild>
                    <a
                      href={template.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Full Size
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Hook Type */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Hook:</span>
            <span className="font-medium text-foreground">{template.hookType}</span>
          </div>

          {/* Key Features Preview */}
          {template.keyFeatures.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {template.keyFeatures.slice(0, 2).map((feature, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {feature}
                </Badge>
              ))}
              {template.keyFeatures.length > 2 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  +{template.keyFeatures.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Visual Style */}
          {template.visualStyle?.primaryColors?.length > 0 && (
            <div className="mt-3 flex items-center gap-1">
              {template.visualStyle.primaryColors.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {template.visualStyle.aesthetic && (
                <span className="text-xs text-muted-foreground ml-2">
                  {template.visualStyle.aesthetic}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{template.name}&quot; and its associated files.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
