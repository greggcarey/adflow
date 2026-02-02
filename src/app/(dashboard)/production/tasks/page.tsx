"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClipboardList,
  Play,
  CheckCircle,
  AlertCircle,
  Trash2,
  Filter,
  Clock,
  User,
  Video,
  Film,
  Eye,
  Send,
  ChevronRight,
  Circle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { TaskWithRelations, TaskStatus, TaskType, TeamMemberWithStats } from "@/types";
import { TASK_STATUS_CONFIG } from "@/types";

// Production stages in order
const PIPELINE_STAGES: TaskType[] = ["FILMING", "EDITING", "REVIEW", "DELIVERY"];

const STAGE_CONFIG: Record<TaskType, { label: string; icon: React.ElementType; color: string }> = {
  FILMING: { label: "Film", icon: Video, color: "text-purple-600" },
  EDITING: { label: "Edit", icon: Film, color: "text-blue-600" },
  REVIEW: { label: "Review", icon: Eye, color: "text-yellow-600" },
  REVISION: { label: "Revision", icon: Loader2, color: "text-orange-600" },
  DELIVERY: { label: "Deliver", icon: Send, color: "text-green-600" },
};

interface ScriptPipeline {
  scriptId: string;
  scriptTitle: string;
  productName: string;
  tasks: Record<TaskType, TaskWithRelations | undefined>;
  currentStage: TaskType | null;
  overallProgress: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, [assigneeFilter]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (assigneeFilter !== "all") params.set("assigneeId", assigneeFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeamMembers() {
    try {
      const res = await fetch("/api/team-members");
      const data = await res.json();
      setTeamMembers(data);
    } catch {
      console.error("Failed to load team members");
    }
  }

  async function updateStatus(id: string, status: TaskStatus) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Status updated to ${TASK_STATUS_CONFIG[status].label}`);
      fetchTasks();

      if (selectedTask?.id === id) {
        const updated = await res.json();
        setSelectedTask(updated);
      }
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function updateAssignee(id: string, assigneeId: string | null) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });

      if (!res.ok) throw new Error("Failed to update assignee");

      toast.success("Assignee updated");
      fetchTasks();
    } catch {
      toast.error("Failed to update assignee");
    }
  }

  async function updateActualTime(id: string, actualTime: number) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualTime }),
      });

      if (!res.ok) throw new Error("Failed to update time");

      toast.success("Actual time logged");
      fetchTasks();

      if (selectedTask?.id === id) {
        const updated = await res.json();
        setSelectedTask(updated);
      }
    } catch {
      toast.error("Failed to update time");
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");

      toast.success("Task deleted");
      setDetailOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch {
      toast.error("Failed to delete task");
    }
  }

  function openDetail(task: TaskWithRelations) {
    setSelectedTask(task);
    setDetailOpen(true);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // Group tasks by script into pipeline view
  const scriptPipelines: ScriptPipeline[] = (() => {
    const scriptMap = new Map<string, ScriptPipeline>();

    tasks.forEach((task) => {
      const scriptId = task.script.id;
      if (!scriptMap.has(scriptId)) {
        scriptMap.set(scriptId, {
          scriptId,
          scriptTitle: task.script.concept.title,
          productName: task.script.concept.product.name,
          tasks: {} as Record<TaskType, TaskWithRelations | undefined>,
          currentStage: null,
          overallProgress: 0,
        });
      }
      const pipeline = scriptMap.get(scriptId)!;
      pipeline.tasks[task.type as TaskType] = task;
    });

    // Calculate current stage and progress for each script
    scriptMap.forEach((pipeline) => {
      let completedStages = 0;
      let foundCurrent = false;

      for (const stage of PIPELINE_STAGES) {
        const task = pipeline.tasks[stage];
        if (task?.status === "COMPLETED") {
          completedStages++;
        } else if (!foundCurrent && task) {
          pipeline.currentStage = stage;
          foundCurrent = true;
        }
      }

      pipeline.overallProgress = Math.round(
        (completedStages / PIPELINE_STAGES.length) * 100
      );
    });

    return Array.from(scriptMap.values());
  })();

  // Check if a stage can be started (previous stage is complete)
  function canStartStage(pipeline: ScriptPipeline, stage: TaskType): boolean {
    const stageIndex = PIPELINE_STAGES.indexOf(stage);
    if (stageIndex === 0) return true;

    const previousStage = PIPELINE_STAGES[stageIndex - 1];
    const previousTask = pipeline.tasks[previousStage];
    return previousTask?.status === "COMPLETED";
  }

  return (
    <>
      <Header
        title="Production Pipeline"
        description="Track scripts through production stages"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pipeline Legend */}
        <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-gray-300" />
            <span>Not Started</span>
          </div>
          <div className="flex items-center gap-1">
            <Loader2 className="h-4 w-4 text-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Done</span>
          </div>
        </div>

        {/* Script Pipelines */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading...
          </div>
        ) : scriptPipelines.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">No scripts in production</p>
            <p className="text-sm text-muted-foreground">
              Approve scripts in the Scripting module to start production
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scriptPipelines.map((pipeline) => (
              <Card key={pipeline.scriptId} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Script Header */}
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{pipeline.scriptTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pipeline.productName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{pipeline.overallProgress}%</p>
                          <p className="text-xs text-muted-foreground">Complete</p>
                        </div>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${pipeline.overallProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Stages */}
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      {PIPELINE_STAGES.map((stage, index) => {
                        const task = pipeline.tasks[stage];
                        const StageIcon = STAGE_CONFIG[stage].icon;
                        const canStart = canStartStage(pipeline, stage);
                        const isBlocked = !canStart && task?.status === "QUEUED";

                        return (
                          <div key={stage} className="flex items-center flex-1">
                            {/* Stage Card */}
                            <button
                              onClick={() => task && openDetail(task)}
                              disabled={!task}
                              className={`flex-1 p-3 rounded-lg border transition-all ${
                                task
                                  ? "hover:border-primary hover:shadow-sm cursor-pointer"
                                  : "opacity-50 cursor-not-allowed"
                              } ${
                                task?.status === "COMPLETED"
                                  ? "bg-green-50 border-green-200"
                                  : task?.status === "IN_PROGRESS"
                                  ? "bg-blue-50 border-blue-200"
                                  : task?.status === "BLOCKED"
                                  ? "bg-red-50 border-red-200"
                                  : "bg-background"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <StageIcon className={`h-4 w-4 ${STAGE_CONFIG[stage].color}`} />
                                  <span className="font-medium text-sm">
                                    {STAGE_CONFIG[stage].label}
                                  </span>
                                </div>
                                {/* Status Icon */}
                                {task?.status === "COMPLETED" && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                {task?.status === "IN_PROGRESS" && (
                                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                                )}
                                {task?.status === "BLOCKED" && (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                {task?.status === "QUEUED" && !isBlocked && (
                                  <Circle className="h-4 w-4 text-gray-300" />
                                )}
                                {isBlocked && (
                                  <Clock className="h-4 w-4 text-gray-400" />
                                )}
                              </div>

                              {task && (
                                <div className="space-y-1">
                                  {/* Assignee */}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {task.assignee ? (
                                      <>
                                        <Avatar className="h-4 w-4">
                                          <AvatarFallback className="text-[8px]">
                                            {getInitials(task.assignee.name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{task.assignee.name}</span>
                                      </>
                                    ) : (
                                      <>
                                        <User className="h-3 w-3" />
                                        <span>Unassigned</span>
                                      </>
                                    )}
                                  </div>
                                  {/* Time */}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {task.actualTime || 0}/{task.estimatedTime}h
                                    </span>
                                  </div>
                                </div>
                              )}

                              {!task && (
                                <p className="text-xs text-muted-foreground">
                                  No task created
                                </p>
                              )}
                            </button>

                            {/* Arrow between stages */}
                            {index < PIPELINE_STAGES.length - 1 && (
                              <ChevronRight className="h-5 w-5 text-muted-foreground mx-1 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedTask && (
            <TaskDetailContent
              task={selectedTask}
              teamMembers={teamMembers}
              onUpdateStatus={updateStatus}
              onUpdateAssignee={updateAssignee}
              onUpdateActualTime={updateActualTime}
              onDelete={deleteTask}
              getInitials={getInitials}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// Task Detail Sheet Content
function TaskDetailContent({
  task,
  teamMembers,
  onUpdateStatus,
  onUpdateAssignee,
  onUpdateActualTime,
  onDelete,
  getInitials,
}: {
  task: TaskWithRelations;
  teamMembers: TeamMemberWithStats[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateAssignee: (id: string, assigneeId: string | null) => void;
  onUpdateActualTime: (id: string, time: number) => void;
  onDelete: (id: string) => void;
  getInitials: (name: string) => string;
}) {
  const [actualTime, setActualTime] = useState(task.actualTime || 0);
  const [blockerNotes, setBlockerNotes] = useState(task.blockers || "");
  const StageIcon = STAGE_CONFIG[task.type as TaskType]?.icon || Video;
  const progress = task.estimatedTime > 0
    ? Math.min((actualTime / task.estimatedTime) * 100, 100)
    : 0;

  async function updateBlockers() {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockers: blockerNotes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Blocker notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <StageIcon className={`h-5 w-5 ${STAGE_CONFIG[task.type as TaskType]?.color}`} />
          {STAGE_CONFIG[task.type as TaskType]?.label || task.type}
        </SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Script Info */}
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-xs text-muted-foreground mb-1">Script</p>
          <p className="font-medium">{task.script.concept.title}</p>
          <p className="text-sm text-muted-foreground">
            {task.script.concept.product.name}
          </p>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Status
          </h4>
          <Badge
            className={`${TASK_STATUS_CONFIG[task.status as TaskStatus].bgColor} ${
              TASK_STATUS_CONFIG[task.status as TaskStatus].color
            }`}
          >
            {TASK_STATUS_CONFIG[task.status as TaskStatus].label}
          </Badge>
        </div>

        {/* Assignee */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Assigned To
          </h4>
          <Select
            value={task.assignee?.id || "unassigned"}
            onValueChange={(value) =>
              onUpdateAssignee(task.id, value === "unassigned" ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
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

        {/* Time Tracking */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Time Tracking
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Estimated: {task.estimatedTime}h</span>
              <span>Actual: {actualTime}h</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  progress > 100
                    ? "bg-red-500"
                    : progress > 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={actualTime}
                onChange={(e) => setActualTime(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">hours</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateActualTime(task.id, actualTime)}
              >
                Log Time
              </Button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {task.notes && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Production Notes
            </h4>
            <p className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
              {task.notes}
            </p>
          </div>
        )}

        {/* Blockers */}
        {(task.status === "BLOCKED" || task.blockers) && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Blocker Notes
            </h4>
            <Textarea
              value={blockerNotes}
              onChange={(e) => setBlockerNotes(e.target.value)}
              placeholder="Describe what's blocking this task..."
              rows={3}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={updateBlockers}
            >
              Save Notes
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {task.status === "QUEUED" && (
            <Button
              onClick={() => onUpdateStatus(task.id, "IN_PROGRESS")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          )}
          {task.status === "IN_PROGRESS" && (
            <>
              <Button
                onClick={() => onUpdateStatus(task.id, "COMPLETED")}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </Button>
              <Button
                variant="outline"
                onClick={() => onUpdateStatus(task.id, "BLOCKED")}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Mark Blocked
              </Button>
            </>
          )}
          {task.status === "BLOCKED" && (
            <Button
              onClick={() => onUpdateStatus(task.id, "IN_PROGRESS")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          )}
          {task.status === "COMPLETED" && (
            <Button
              variant="outline"
              onClick={() => onUpdateStatus(task.id, "IN_PROGRESS")}
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Reopen
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Task
        </Button>
      </div>
    </>
  );
}
