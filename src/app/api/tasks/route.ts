import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const taskCreateSchema = z.object({
  type: z.enum(["FILMING", "EDITING", "REVIEW", "REVISION", "DELIVERY"]),
  scriptId: z.string().uuid(),
  assigneeId: z.string().uuid().optional().nullable(),
  estimatedTime: z.number().min(0),
  dueDate: z.string().datetime().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const type = searchParams.get("type");
    const scriptId = searchParams.get("scriptId");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (assigneeId && assigneeId !== "all") {
      where.assigneeId = assigneeId === "unassigned" ? null : assigneeId;
    }
    if (type && type !== "all") {
      where.type = type;
    }
    if (scriptId) {
      where.scriptId = scriptId;
    }

    const tasks = await db.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
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

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = taskCreateSchema.parse(body);

    // Verify script exists
    const script = await db.script.findUnique({
      where: { id: data.scriptId },
    });

    if (!script) {
      return NextResponse.json(
        { error: "Script not found" },
        { status: 404 }
      );
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

    const task = await db.task.create({
      data: {
        type: data.type,
        status: "QUEUED",
        scriptId: data.scriptId,
        assigneeId: data.assigneeId || null,
        estimatedTime: data.estimatedTime,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        notes: data.notes || null,
      },
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
