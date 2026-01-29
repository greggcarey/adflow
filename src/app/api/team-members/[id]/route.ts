import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const teamMemberUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  capacityHours: z.number().min(0).max(24).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamMember = await db.teamMember.findUnique({
      where: { id },
      include: {
        tasksAssigned: {
          orderBy: { createdAt: "desc" },
          take: 10,
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
          },
        },
        _count: {
          select: { tasksAssigned: true },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Calculate assigned hours
    const assignedTasks = await db.task.aggregate({
      where: {
        assigneeId: id,
        status: { not: "COMPLETED" },
      },
      _sum: {
        estimatedTime: true,
      },
    });

    return NextResponse.json({
      ...teamMember,
      assignedHours: assignedTasks._sum.estimatedTime || 0,
    });
  } catch (error) {
    console.error("Failed to fetch team member:", error);
    return NextResponse.json(
      { error: "Failed to fetch team member" },
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
    const data = teamMemberUpdateSchema.parse(body);

    // If updating email, check for duplicates
    if (data.email) {
      const existing = await db.teamMember.findFirst({
        where: {
          email: data.email,
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "A team member with this email already exists" },
          { status: 400 }
        );
      }
    }

    const teamMember = await db.teamMember.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { tasksAssigned: true },
        },
      },
    });

    // Calculate assigned hours
    const assignedTasks = await db.task.aggregate({
      where: {
        assigneeId: id,
        status: { not: "COMPLETED" },
      },
      _sum: {
        estimatedTime: true,
      },
    });

    return NextResponse.json({
      ...teamMember,
      assignedHours: assignedTasks._sum.estimatedTime || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
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

    // Check for assigned tasks
    const assignedTasksCount = await db.task.count({
      where: { assigneeId: id },
    });

    if (assignedTasksCount > 0) {
      // Unassign tasks before deletion
      await db.task.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      });
    }

    await db.teamMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team member:", error);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500 }
    );
  }
}
