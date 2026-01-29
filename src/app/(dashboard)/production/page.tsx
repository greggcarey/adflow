export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Video,
  ClipboardList,
  Users,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

async function getProductionStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [tasksByStatus, teamMembers, recentTasks, completedToday] =
    await Promise.all([
      db.task.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      db.teamMember.findMany({
        include: {
          _count: { select: { tasksAssigned: true } },
        },
      }),
      db.task.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          script: {
            include: {
              concept: {
                select: {
                  title: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
          assignee: true,
        },
      }),
      db.task.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: today },
        },
      }),
    ]);

  // Calculate assigned hours for each team member
  const membersWithHours = await Promise.all(
    teamMembers.map(async (member) => {
      const result = await db.task.aggregate({
        where: {
          assigneeId: member.id,
          status: { not: "COMPLETED" },
        },
        _sum: { estimatedTime: true },
      });
      return {
        ...member,
        assignedHours: result._sum.estimatedTime || 0,
      };
    })
  );

  const statusCounts = tasksByStatus.reduce(
    (acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    statusCounts,
    teamMembers: membersWithHours,
    recentTasks,
    completedToday,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getCapacityColor(assigned: number, capacity: number) {
  const ratio = assigned / capacity;
  if (ratio >= 1) return "text-red-600";
  if (ratio >= 0.75) return "text-yellow-600";
  return "text-green-600";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  QUEUED: { label: "Queued", color: "text-gray-700", bgColor: "bg-gray-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-700", bgColor: "bg-blue-100" },
  BLOCKED: { label: "Blocked", color: "text-red-700", bgColor: "bg-red-100" },
  COMPLETED: { label: "Completed", color: "text-green-700", bgColor: "bg-green-100" },
};

export default async function ProductionPage() {
  const stats = await getProductionStats();
  const totalTasks = Object.values(stats.statusCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <Header
        title="Production"
        description="Manage production tasks and team workload"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                Across all statuses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Play className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.statusCounts.IN_PROGRESS || 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.statusCounts.BLOCKED || 0}
              </div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completedToday}
              </div>
              <p className="text-xs text-muted-foreground">Tasks finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    Create and track production tasks
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold">{totalTasks}</span>
              <Link href="/production/tasks">
                <Button variant="outline">
                  View Tasks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Team</CardTitle>
                  <CardDescription>
                    Manage team members and assignments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {stats.teamMembers.length}
              </span>
              <Link href="/production/team">
                <Button variant="outline">
                  Manage Team
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Task Pipeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Task Pipeline</CardTitle>
                <CardDescription>
                  Track tasks through the production workflow
                </CardDescription>
              </div>
              <Link href="/production/tasks">
                <Button variant="outline">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <p className="text-3xl font-bold text-gray-600">
                  {stats.statusCounts.QUEUED || 0}
                </p>
                <p className="text-sm text-gray-600">Queued</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.statusCounts.IN_PROGRESS || 0}
                </p>
                <p className="text-sm text-blue-600">In Progress</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50">
                <p className="text-3xl font-bold text-red-600">
                  {stats.statusCounts.BLOCKED || 0}
                </p>
                <p className="text-sm text-red-600">Blocked</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50">
                <p className="text-3xl font-bold text-green-600">
                  {stats.statusCounts.COMPLETED || 0}
                </p>
                <p className="text-sm text-green-600">Completed</p>
              </div>
            </div>

            {totalTasks === 0 && (
              <div className="text-center py-8 mt-4 border-t">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No tasks yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first task to start tracking production
                </p>
                <Link href="/production/tasks">
                  <Button>Create Task</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Latest production tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No tasks yet
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {task.assignee ? (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(task.assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{task.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.script.concept.title}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${STATUS_CONFIG[task.status]?.bgColor} ${STATUS_CONFIG[task.status]?.color}`}
                      >
                        {STATUS_CONFIG[task.status]?.label}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card>
            <CardHeader>
              <CardTitle>Team Workload</CardTitle>
              <CardDescription>Current assignments by member</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.teamMembers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">No team members</p>
                  <Link href="/production/team">
                    <Button variant="outline" size="sm">
                      Add Team Member
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={`text-sm font-medium ${getCapacityColor(
                            member.assignedHours,
                            member.capacityHours
                          )}`}
                        >
                          {member.assignedHours}h / {member.capacityHours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
