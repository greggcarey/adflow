import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const teamMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().min(1),
  capacityHours: z.number().min(0).max(24).default(8),
});

export async function GET() {
  try {
    const teamMembers = await db.teamMember.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { tasksAssigned: true },
        },
      },
    });

    // Calculate assigned hours for each member (sum of estimatedTime for non-completed tasks)
    const membersWithStats = await Promise.all(
      teamMembers.map(async (member) => {
        const assignedTasks = await db.task.aggregate({
          where: {
            assigneeId: member.id,
            status: { not: "COMPLETED" },
          },
          _sum: {
            estimatedTime: true,
          },
        });

        return {
          ...member,
          assignedHours: assignedTasks._sum.estimatedTime || 0,
        };
      })
    );

    return NextResponse.json(membersWithStats);
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = teamMemberSchema.parse(body);

    // Check if email already exists
    const existing = await db.teamMember.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A team member with this email already exists" },
        { status: 400 }
      );
    }

    const teamMember = await db.teamMember.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        capacityHours: data.capacityHours,
      },
      include: {
        _count: {
          select: { tasksAssigned: true },
        },
      },
    });

    return NextResponse.json(
      { ...teamMember, assignedHours: 0 },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create team member:", error);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}
