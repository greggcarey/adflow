"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, X, Save, Sparkles, Loader2 } from "lucide-react";
import type { ScriptSection } from "@/types";

interface EditableScriptSectionProps {
  sectionKey: string;
  section: ScriptSection;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updatedSection: ScriptSection) => Promise<void>;
  onAiRevise: () => void;
  saving: boolean;
  disabled?: boolean;
}

export function EditableScriptSection({
  sectionKey,
  section,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onAiRevise,
  saving,
  disabled = false,
}: EditableScriptSectionProps) {
  const [editedSection, setEditedSection] = useState<ScriptSection>(section);

  const sectionName = sectionKey.replace(/([A-Z])/g, " $1").trim();

  const handleStartEdit = () => {
    setEditedSection(section);
    onStartEdit();
  };

  const handleSave = async () => {
    await onSave(editedSection);
  };

  const handleCancel = () => {
    setEditedSection(section);
    onCancelEdit();
  };

  if (isEditing) {
    return (
      <div className="border rounded p-3 bg-muted/30">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium capitalize">{sectionName}</span>
          {section.startTime !== undefined && section.endTime !== undefined && (
            <span className="text-xs text-muted-foreground">
              {section.startTime}s - {section.endTime}s
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor={`${sectionKey}-spoken`} className="text-xs">
              Spoken Text
            </Label>
            <Textarea
              id={`${sectionKey}-spoken`}
              value={editedSection.spokenText}
              onChange={(e) =>
                setEditedSection({ ...editedSection, spokenText: e.target.value })
              }
              className="mt-1 min-h-[80px]"
              placeholder="Enter the voiceover text..."
            />
          </div>

          <div>
            <Label htmlFor={`${sectionKey}-visual`} className="text-xs">
              Visual Direction
            </Label>
            <Textarea
              id={`${sectionKey}-visual`}
              value={editedSection.visualDirection}
              onChange={(e) =>
                setEditedSection({ ...editedSection, visualDirection: e.target.value })
              }
              className="mt-1 min-h-[60px]"
              placeholder="Describe the visual scene..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onAiRevise}
              disabled={saving}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Revise
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded p-3 group relative">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium capitalize">{sectionName}</span>
        <div className="flex items-center gap-2">
          {section.startTime !== undefined && section.endTime !== undefined && (
            <span className="text-xs text-muted-foreground">
              {section.startTime}s - {section.endTime}s
            </span>
          )}
          {!disabled && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit();
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {section.spokenText && (
        <p className="text-muted-foreground text-sm">{section.spokenText}</p>
      )}
      {section.visualDirection && (
        <p className="text-xs text-muted-foreground/70 mt-1 italic">
          Visual: {section.visualDirection}
        </p>
      )}
    </div>
  );
}
