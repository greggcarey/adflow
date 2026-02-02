import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateProductionTasks, hasExistingTasks } from "@/lib/production";

const updateScriptSchema = z.object({
  content: z.record(z.string(), z.unknown()).optional(),
  textOverlays: z.array(z.record(z.string(), z.unknown())).optional(),
  status: z
    .enum(["DRAFT", "IN_REVIEW", "REVISION_REQUESTED", "APPROVED", "IN_PRODUCTION", "COMPLETED"])
    .optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const script = await db.script.findUnique({
      where: { id },
      include: {
        concept: {
          include: {
            product: true,
            icp: true,
          },
        },
        productionReq: true,
        approvedBy: { select: { id: true, name: true } },
        parentVersion: { select: { id: true, version: true } },
        childVersions: {
          select: { id: true, version: true, createdAt: true },
          orderBy: { version: "desc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    return NextResponse.json(script);
  } catch (error) {
    console.error("Failed to fetch script:", error);
    return NextResponse.json(
      { error: "Failed to fetch script" },
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
    const data = updateScriptSchema.parse(body);

    // Get current script to check status change
    const currentScript = await db.script.findUnique({
      where: { id },
      select: { status: true },
    });

    const updateData: Record<string, unknown> = {};

    if (data.content !== undefined) updateData.content = data.content;
    if (data.textOverlays !== undefined) updateData.textOverlays = data.textOverlays;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "APPROVED") {
        updateData.approvedAt = new Date();
      }
    }

    const script = await db.script.update({
      where: { id },
      data: updateData,
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
    });

    // Auto-generate production tasks when script is approved
    if (
      data.status === "APPROVED" &&
      currentScript?.status !== "APPROVED"
    ) {
      // Only generate tasks if none exist yet
      const tasksExist = await hasExistingTasks(id);
      if (!tasksExist) {
        await generateProductionTasks({
          id: script.id,
          duration: script.duration,
          aspectRatios: script.aspectRatios,
          productionReq: script.productionReq,
        });
        // Update script status to IN_PRODUCTION after creating tasks
        await db.script.update({
          where: { id },
          data: { status: "IN_PRODUCTION" },
        });
        script.status = "IN_PRODUCTION";
      }
    }

    return NextResponse.json(script);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update script:", error);
    return NextResponse.json(
      { error: "Failed to update script" },
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
    await db.script.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete script:", error);
    return NextResponse.json(
      { error: "Failed to delete script" },
      { status: 500 }
    );
  }
}
