import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const taskConfigSchema = z.object({
  type: z.enum(["FILMING", "EDITING", "REVIEW", "REVISION", "DELIVERY"]),
  estimatedTime: z.number().min(1),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createProductionTasksSchema = z.object({
  tasks: z.array(taskConfigSchema).min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scriptId } = await params;
    const body = await request.json();
    const { tasks: taskConfigs } = createProductionTasksSchema.parse(body);

    // Verify script exists and is approved
    const script = await db.script.findUnique({
      where: { id: scriptId },
      include: {
        tasks: true,
        concept: {
          select: { title: true },
        },
      },
    });

    if (!script) {
      return NextResponse.json(
        { error: "Script not found" },
        { status: 404 }
      );
    }

    if (script.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Script must be approved before creating production tasks" },
        { status: 400 }
      );
    }

    // Check if tasks already exist for this script
    if (script.tasks.length > 0) {
      return NextResponse.json(
        { error: "Production tasks already exist for this script" },
        { status: 400 }
      );
    }

    // Verify all assignees exist
    const assigneeIds = taskConfigs
      .map((t) => t.assigneeId)
      .filter((id): id is string => !!id);

    if (assigneeIds.length > 0) {
      const uniqueAssigneeIds = [...new Set(assigneeIds)];
      const assignees = await db.teamMember.findMany({
        where: { id: { in: uniqueAssigneeIds } },
      });

      if (assignees.length !== uniqueAssigneeIds.length) {
        return NextResponse.json(
          { error: "One or more team members not found" },
          { status: 404 }
        );
      }
    }

    // Create all tasks in a transaction
    const createdTasks = await db.$transaction(async (tx) => {
      // Create tasks
      const tasks = await Promise.all(
        taskConfigs.map((config) =>
          tx.task.create({
            data: {
              type: config.type,
              status: "QUEUED",
              scriptId,
              estimatedTime: config.estimatedTime,
              assigneeId: config.assigneeId || null,
              dueDate: config.dueDate ? new Date(config.dueDate) : null,
              notes: config.notes || null,
            },
            include: {
              assignee: true,
            },
          })
        )
      );

      // Update script status to IN_PRODUCTION
      await tx.script.update({
        where: { id: scriptId },
        data: { status: "IN_PRODUCTION" },
      });

      return tasks;
    });

    return NextResponse.json(
      {
        message: "Production tasks created successfully",
        tasks: createdTasks,
        scriptStatus: "IN_PRODUCTION",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create production tasks:", error);
    return NextResponse.json(
      { error: "Failed to create production tasks" },
      { status: 500 }
    );
  }
}
