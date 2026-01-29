import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { regenerateConcept } from "@/lib/ai";
import { z } from "zod";

const regenerateSchema = z.object({
  conceptId: z.string().uuid(),
  feedback: z.string().min(1, "Feedback is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = regenerateSchema.parse(body);

    // Fetch the concept with its product and ICP
    const concept = await db.concept.findUnique({
      where: { id: data.conceptId },
      include: {
        product: true,
        icp: true,
      },
    });

    if (!concept) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured. Please set ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    // Regenerate the concept
    const regeneratedConcept = await regenerateConcept({
      concept,
      product: concept.product,
      icp: concept.icp,
      feedback: data.feedback,
    });

    // Save as a new concept (keeping original for comparison)
    const savedConcept = await db.concept.create({
      data: {
        title: regeneratedConcept.title,
        hookType: regeneratedConcept.hookType,
        hookText: regeneratedConcept.hookText,
        angle: regeneratedConcept.angle,
        format: regeneratedConcept.format,
        platform: regeneratedConcept.platform,
        coreMessage: regeneratedConcept.coreMessage,
        rationale: regeneratedConcept.rationale,
        complexity: regeneratedConcept.complexity,
        status: "GENERATED",
        notes: `Regenerated from concept: ${concept.title}\n\nFeedback: ${data.feedback}`,
        productId: concept.productId,
        icpId: concept.icpId,
      },
      include: {
        product: { select: { name: true } },
        icp: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      concept: savedConcept,
      originalConceptId: data.conceptId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to regenerate concept:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to regenerate concept", details: errorMessage },
      { status: 500 }
    );
  }
}
