import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviseScriptSection } from "@/lib/ai";
import { z } from "zod";

const reviseScriptSchema = z.object({
  scriptId: z.string().uuid(),
  sectionToRevise: z.enum(["hook", "problemSetup", "solution", "proof", "cta", "closing"]),
  feedback: z.string().min(1, "Feedback is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = reviseScriptSchema.parse(body);

    // Fetch the script with its concept and product
    const script = await db.script.findUnique({
      where: { id: data.scriptId },
      include: {
        concept: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured. Please set ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    // Revise the section
    const revisedSection = await reviseScriptSection({
      script,
      concept: script.concept,
      product: script.concept.product,
      sectionToRevise: data.sectionToRevise,
      feedback: data.feedback,
    });

    // Update the script content with the revised section
    const currentContent = script.content as Record<string, unknown>;
    const updatedContent = {
      ...currentContent,
      [data.sectionToRevise]: revisedSection,
    };

    // Create a new version of the script
    const updatedScript = await db.script.create({
      data: {
        conceptId: script.conceptId,
        version: script.version + 1,
        content: updatedContent as object,
        duration: script.duration,
        aspectRatios: script.aspectRatios,
        textOverlays: script.textOverlays as object[],
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
      script: updatedScript,
      revisedSection: data.sectionToRevise,
      previousVersion: script.version,
      newVersion: updatedScript.version,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to revise script:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to revise script", details: errorMessage },
      { status: 500 }
    );
  }
}
