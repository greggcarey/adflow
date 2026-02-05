import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const scriptSectionSchema = z.object({
  name: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  spokenText: z.string(),
  visualDirection: z.string(),
  textOverlay: z.string().optional(),
  transition: z.string().optional(),
});

const createVersionSchema = z.object({
  updatedSections: z.record(
    z.enum(["hook", "problemSetup", "solution", "proof", "cta", "closing"]),
    scriptSectionSchema
  ),
  editSource: z.enum(["manual", "ai"]).default("manual"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = createVersionSchema.parse(body);

    // Fetch the current script
    const script = await db.script.findUnique({
      where: { id },
      include: {
        concept: {
          select: {
            id: true,
            title: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Parse current content and merge with updated sections
    const currentContent = JSON.parse(script.content) as Record<string, unknown>;
    const updatedContent = {
      ...currentContent,
      ...data.updatedSections,
    };

    // Create a new version of the script
    const newScript = await db.script.create({
      data: {
        conceptId: script.conceptId,
        version: script.version + 1,
        content: JSON.stringify(updatedContent),
        duration: script.duration,
        aspectRatios: script.aspectRatios,
        textOverlays: script.textOverlays,
        status: "DRAFT",
        parentId: script.id,
      },
      include: {
        concept: {
          select: {
            id: true,
            title: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      script: {
        ...newScript,
        content: JSON.parse(newScript.content),
        aspectRatios: JSON.parse(newScript.aspectRatios),
        textOverlays: JSON.parse(newScript.textOverlays),
      },
      editSource: data.editSource,
      previousVersion: script.version,
      newVersion: newScript.version,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to create script version:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to create script version", details: errorMessage },
      { status: 500 }
    );
  }
}
