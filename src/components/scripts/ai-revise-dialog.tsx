"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ScriptSection } from "@/types";

interface AIReviseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scriptId: string;
  sectionKey: string;
  currentContent: ScriptSection;
  onSuccess: () => void;
}

export function AIReviseDialog({
  open,
  onOpenChange,
  scriptId,
  sectionKey,
  currentContent,
  onSuccess,
}: AIReviseDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [revising, setRevising] = useState(false);

  const sectionName = sectionKey.replace(/([A-Z])/g, " $1").trim();

  async function handleRevise() {
    if (!feedback.trim()) {
      toast.error("Please provide revision feedback");
      return;
    }

    setRevising(true);
    try {
      const res = await fetch("/api/ai/revise-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId,
          sectionToRevise: sectionKey,
          feedback: feedback.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to revise script");
      }

      toast.success(`${sectionName} revised! New version v${data.newVersion} created.`);
      setFeedback("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revise script");
    } finally {
      setRevising(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Revise: {sectionName}
          </DialogTitle>
          <DialogDescription>
            Describe what changes you&apos;d like the AI to make to this section.
            A new version will be created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground">Current Content</Label>
            <div className="mt-1 p-3 bg-muted rounded text-sm">
              <p className="font-medium">Spoken Text:</p>
              <p className="text-muted-foreground">{currentContent.spokenText}</p>
              {currentContent.visualDirection && (
                <>
                  <p className="font-medium mt-2">Visual Direction:</p>
                  <p className="text-muted-foreground">{currentContent.visualDirection}</p>
                </>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="feedback">Revision Feedback</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Make the hook more attention-grabbing, add urgency, shorten the text..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={revising}
            >
              Cancel
            </Button>
            <Button onClick={handleRevise} disabled={revising || !feedback.trim()}>
              {revising ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revising...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Revise with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
