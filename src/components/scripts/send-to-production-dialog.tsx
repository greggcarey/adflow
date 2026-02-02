"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Video, Film, Eye, Send } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface TaskConfig {
  type: "FILMING" | "EDITING" | "REVIEW" | "DELIVERY";
  label: string;
  icon: React.ElementType;
  estimatedTime: number;
  assigneeId: string | null;
  enabled: boolean;
}

interface SendToProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scriptId: string;
  scriptTitle: string;
  onSuccess: () => void;
}

const DEFAULT_TASKS: TaskConfig[] = [
  { type: "FILMING", label: "Filming", icon: Video, estimatedTime: 4, assigneeId: null, enabled: true },
  { type: "EDITING", label: "Editing", icon: Film, estimatedTime: 6, assigneeId: null, enabled: true },
  { type: "REVIEW", label: "Review", icon: Eye, estimatedTime: 2, assigneeId: null, enabled: true },
  { type: "DELIVERY", label: "Delivery", icon: Send, estimatedTime: 1, assigneeId: null, enabled: true },
];

export function SendToProductionDialog({
  open,
  onOpenChange,
  scriptId,
  scriptTitle,
  onSuccess,
}: SendToProductionDialogProps) {
  const [tasks, setTasks] = useState<TaskConfig[]>(DEFAULT_TASKS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
      setTasks(DEFAULT_TASKS);
    }
  }, [open]);

  async function fetchTeamMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/team-members");
      const data = await res.json();
      setTeamMembers(data);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateTask(index: number, updates: Partial<TaskConfig>) {
    setTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, ...updates } : task))
    );
  }

  async function handleSubmit() {
    const enabledTasks = tasks.filter((t) => t.enabled);
    if (enabledTasks.length === 0) {
      toast.error("Please enable at least one production stage");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}/create-production-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: enabledTasks.map((t) => ({
            type: t.type,
            estimatedTime: t.estimatedTime,
            assigneeId: t.assigneeId,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create production tasks");
      }

      toast.success(`Created ${enabledTasks.length} production tasks`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tasks");
    } finally {
      setSubmitting(false);
    }
  }

  const totalHours = tasks.filter((t) => t.enabled).reduce((sum, t) => sum + t.estimatedTime, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send to Production</DialogTitle>
          <DialogDescription>
            Create production tasks for &quot;{scriptTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {tasks.map((task, index) => {
              const Icon = task.icon;
              return (
                <div
                  key={task.type}
                  className={`border rounded-lg p-4 space-y-3 ${
                    task.enabled ? "bg-background" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.enabled}
                        onChange={(e) => updateTask(index, { enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{task.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Est. hours:</span>
                      <Select
                        value={task.estimatedTime.toString()}
                        onValueChange={(v) => updateTask(index, { estimatedTime: parseInt(v) })}
                        disabled={!task.enabled}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((h) => (
                            <SelectItem key={h} value={h.toString()}>
                              {h}h
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {task.enabled && (
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-sm text-muted-foreground">Assign to:</span>
                      <Select
                        value={task.assigneeId || "unassigned"}
                        onValueChange={(v) =>
                          updateTask(index, { assigneeId: v === "unassigned" ? null : v })
                        }
                      >
                        <SelectTrigger className="flex-1 h-8">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Total estimated: <span className="font-medium text-foreground">{totalHours} hours</span>
              </div>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create Tasks
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
