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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClipboardList,
  MoreVertical,
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
  RefreshCw,
  Send,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { TaskWithRelations, TaskStatus, TaskType, TeamMemberWithStats } from "@/types";
import { TASK_STATUS_CONFIG, TASK_TYPE_CONFIG } from "@/types";

// Production stages in order
const STAGES: TaskType[] = ["FILMING", "EDITING", "REVIEW", "DELIVERY"];

const STAGE_CONFIG: Record<TaskType, { label: string; icon: React.ElementType; color: string }> = {
  FILMING: { label: "Filming", icon: Video, color: "bg-purple-500" },
  EDITING: { label: "Editing", icon: Film, color: "bg-blue-500" },
  REVIEW: { label: "Review", icon: Eye, color: "bg-yellow-500" },
  REVISION: { label: "Revision", icon: RefreshCw, color: "bg-orange-500" },
  DELIVERY: { label: "Delivery", icon: Send, color: "bg-green-500" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, [statusFilter, assigneeFilter]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
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

  // Group tasks by stage (task type)
  const tasksByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = tasks.filter((t) => t.type === stage);
    return acc;
  }, {} as Record<TaskType, TaskWithRelations[]>);

  // Check if previous stage is complete for a script
  function isPreviousStageComplete(task: TaskWithRelations): boolean {
    const stageIndex = STAGES.indexOf(task.type as TaskType);
    if (stageIndex === 0) return true; // First stage, no previous

    const previousStage = STAGES[stageIndex - 1];
    const previousTask = tasks.find(
      (t) => t.script.id === task.script.id && t.type === previousStage
    );
    return previousTask?.status === "COMPLETED";
  }

  // Get the current active stage for a script
  function getScriptCurrentStage(scriptId: string): TaskType | null {
    for (const stage of STAGES) {
      const task = tasks.find((t) => t.script.id === scriptId && t.type === stage);
      if (task && task.status !== "COMPLETED") {
        return stage as TaskType;
      }
    }
    return null;
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

        {/* Stage-based Pipeline */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading...
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">No scripts in production</p>
            <p className="text-sm text-muted-foreground">
              Approve scripts in the Scripting module to start production
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAGES.map((stage, index) => {
              const StageIcon = STAGE_CONFIG[stage].icon;
              const stageTasks = tasksByStage[stage] || [];

              return (
                <div key={stage} className="space-y-3">
                  {/* Stage Header */}
                  <div className="flex items-center gap-2 px-2">
                    <div className={`h-3 w-3 rounded-full ${STAGE_CONFIG[stage].color}`} />
                    <StageIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{STAGE_CONFIG[stage].label}</h3>
                    <Badge variant="secondary">{stageTasks.length}</Badge>
                    {index < STAGES.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    )}
                  </div>

                  {/* Script Cards in this Stage */}
                  <div className="space-y-3 min-h-[200px]">
                    {stageTasks.map((task) => {
                      const canStart = isPreviousStageComplete(task);
                      const isBlocked = !canStart && task.status === "QUEUED";

                      return (
                        <ScriptStageCard
                          key={task.id}
                          task={task}
                          canStart={canStart}
                          isBlocked={isBlocked}
                          teamMembers={teamMembers}
                          onOpenDetail={openDetail}
                          onUpdateStatus={updateStatus}
                          onUpdateAssignee={updateAssignee}
                          onDelete={deleteTask}
                          getInitials={getInitials}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
              onClose={() => setDetailOpen(false)}
              getInitials={getInitials}
              isPreviousComplete={isPreviousStageComplete(selectedTask)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// Script Card for Stage-based View
function ScriptStageCard({
  task,
  canStart,
  isBlocked,
  teamMembers,
  onOpenDetail,
  onUpdateStatus,
  onUpdateAssignee,
  onDelete,
  getInitials,
}: {
  task: TaskWithRelations;
  canStart: boolean;
  isBlocked: boolean;
  teamMembers: TeamMemberWithStats[];
  onOpenDetail: (t: TaskWithRelations) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateAssignee: (id: string, assigneeId: string | null) => void;
  onDelete: (id: string) => void;
  getInitials: (name: string) => string;
}) {
  const statusConfig = TASK_STATUS_CONFIG[task.status as TaskStatus];

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isBlocked ? "opacity-60 border-dashed" : ""
      } ${task.status === "COMPLETED" ? "bg-green-50/50" : ""}`}
      onClick={() => onOpenDetail(task)}
    >
      <CardContent className="p-4">
        {/* Script Title */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {task.script.concept.title}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {task.script.concept.product.name}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {task.status === "QUEUED" && canStart && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(task.id, "IN_PROGRESS");
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </DropdownMenuItem>
              )}
              {task.status === "IN_PROGRESS" && (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(task.id, "BLOCKED");
                    }}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Mark Blocked
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(task.id, "COMPLETED");
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete
                  </DropdownMenuItem>
                </>
              )}
              {task.status === "BLOCKED" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(task.id, "IN_PROGRESS");
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </DropdownMenuItem>
              )}
              {task.status === "COMPLETED" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(task.id, "IN_PROGRESS");
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reopen
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
            {isBlocked ? "Waiting" : statusConfig.label}
          </Badge>
          {isBlocked && (
            <span className="text-xs text-muted-foreground">
              (previous stage incomplete)
            </span>
          )}
        </div>

        {/* Footer: Assignee & Time */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate max-w-[80px]">
                  {task.assignee.name}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Unassigned
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {task.actualTime || 0}/{task.estimatedTime}h
          </div>
        </div>
      </CardContent>
    </Card>
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
  onClose,
  getInitials,
  isPreviousComplete,
}: {
  task: TaskWithRelations;
  teamMembers: TeamMemberWithStats[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateAssignee: (id: string, assigneeId: string | null) => void;
  onUpdateActualTime: (id: string, time: number) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  getInitials: (name: string) => string;
  isPreviousComplete: boolean;
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
          <StageIcon className="h-5 w-5" />
          {STAGE_CONFIG[task.type as TaskType]?.label || task.type}
        </SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Script Info */}
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-xs text-muted-foreground mb-1">Script</p>
          <p className="font-medium">{task.script.concept.title}</p>
          <p className="text-sm text-muted-foreground">
            {task.script.concept.product.name} • Version {task.script.version}
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
          {!isPreviousComplete && task.status === "QUEUED" && (
            <p className="text-xs text-muted-foreground mt-2">
              Waiting for previous stage to complete
            </p>
          )}
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
          {task.status === "QUEUED" && isPreviousComplete && (
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
              <RefreshCw className="mr-2 h-4 w-4" />
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
