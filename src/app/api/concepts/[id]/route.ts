import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const updateConceptSchema = z.object({
  status: z
    .enum([
      "GENERATED",
      "IN_REVIEW",
      "APPROVED",
      "REVISION_REQUESTED",
      "ARCHIVED",
      "REJECTED",
    ])
    .optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
  title: z.string().optional(),
  hookText: z.string().optional(),
  coreMessage: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const concept = await db.concept.findUnique({
      where: { id },
      include: {
        product: true,
        icp: true,
        scripts: {
          orderBy: { version: "desc" },
          take: 5,
        },
      },
    });

    if (!concept) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    }

    return NextResponse.json(concept);
  } catch (error) {
    console.error("Failed to fetch concept:", error);
    return NextResponse.json(
      { error: "Failed to fetch concept" },
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
    const data = updateConceptSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "APPROVED") {
        updateData.approvedAt = new Date();
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.hookText !== undefined) updateData.hookText = data.hookText;
    if (data.coreMessage !== undefined) updateData.coreMessage = data.coreMessage;

    const concept = await db.concept.update({
      where: { id },
      data: updateData,
      include: {
        product: { select: { id: true, name: true } },
        icp: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(concept);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update concept:", error);
    return NextResponse.json(
      { error: "Failed to update concept" },
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
    await db.concept.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete concept:", error);
    return NextResponse.json(
      { error: "Failed to delete concept" },
      { status: 500 }
    );
  }
}
