import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const taskUpdateSchema = z.object({
  type: z
    .enum(["FILMING", "EDITING", "REVIEW", "REVISION", "DELIVERY"])
    .optional(),
  status: z.enum(["QUEUED", "IN_PROGRESS", "BLOCKED", "COMPLETED"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  estimatedTime: z.number().min(0).optional(),
  actualTime: z.number().min(0).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  blockers: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await db.task.findUnique({
      where: { id },
      include: {
        script: {
          include: {
            concept: {
              select: {
                id: true,
                title: true,
                product: { select: { name: true } },
              },
            },
            productionReq: true,
          },
        },
        assignee: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = taskUpdateSchema.parse(body);

    // Get current task to check status change
    const currentTask = await db.task.findUnique({
      where: { id },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify assignee exists if provided
    if (data.assigneeId) {
      const assignee = await db.teamMember.findUnique({
        where: { id: data.assigneeId },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: "Team member not found" },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) {
      updateData.status = data.status;
      // Set completedAt when status changes to COMPLETED
      if (data.status === "COMPLETED" && currentTask.status !== "COMPLETED") {
        updateData.completedAt = new Date();
      }
      // Clear completedAt when status changes from COMPLETED
      if (data.status !== "COMPLETED" && currentTask.status === "COMPLETED") {
        updateData.completedAt = null;
      }
    }
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.estimatedTime !== undefined)
      updateData.estimatedTime = data.estimatedTime;
    if (data.actualTime !== undefined) updateData.actualTime = data.actualTime;
    if (data.dueDate !== undefined)
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.scheduledFor !== undefined)
      updateData.scheduledFor = data.scheduledFor
        ? new Date(data.scheduledFor)
        : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.blockers !== undefined) updateData.blockers = data.blockers;

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        script: {
          include: {
            concept: {
              select: {
                id: true,
                title: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        assignee: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
