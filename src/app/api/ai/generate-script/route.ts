import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateScript, generateProductionRequirements } from "@/lib/ai";
import { z } from "zod";

const generateScriptSchema = z.object({
  conceptId: z.string().uuid(),
  duration: z.number().min(10).max(180).default(30),
  aspectRatios: z.array(z.string()).default(["9:16", "1:1"]),
  platform: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = generateScriptSchema.parse(body);

    // Fetch the concept with its product and ICP
    const conceptRaw = await db.concept.findUnique({
      where: { id: data.conceptId },
      include: {
        product: true,
        icp: true,
      },
    });

    if (!conceptRaw) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    }

    // Concept must be approved to generate script
    if (conceptRaw.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Concept must be approved before generating a script" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured. Please set ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    // Parse JSON strings for SQLite compatibility
    const product = {
      ...conceptRaw.product,
      features: JSON.parse(conceptRaw.product.features),
      usps: JSON.parse(conceptRaw.product.usps),
      imageUrls: JSON.parse(conceptRaw.product.imageUrls),
    };

    const icp = {
      ...conceptRaw.icp,
      demographics: JSON.parse(conceptRaw.icp.demographics),
      psychographics: JSON.parse(conceptRaw.icp.psychographics),
      painPoints: JSON.parse(conceptRaw.icp.painPoints),
      aspirations: JSON.parse(conceptRaw.icp.aspirations),
      buyingTriggers: JSON.parse(conceptRaw.icp.buyingTriggers),
      platforms: JSON.parse(conceptRaw.icp.platforms),
    };

    const concept = conceptRaw;

    // Generate the script
    const generatedScript = await generateScript({
      concept,
      product,
      icp,
      duration: data.duration,
      aspectRatios: data.aspectRatios,
      platform: data.platform || concept.platform,
    });

    // Save the script to database (serialize for SQLite)
    const savedScript = await db.script.create({
      data: {
        conceptId: data.conceptId,
        version: 1,
        content: JSON.stringify(generatedScript.content),
        duration: generatedScript.duration,
        aspectRatios: JSON.stringify(generatedScript.aspectRatios),
        textOverlays: JSON.stringify(generatedScript.textOverlays),
        status: "DRAFT",
      },
      include: {
        concept: {
          select: {
            id: true,
            title: true,
            product: { select: { name: true } },
            icp: { select: { name: true } },
          },
        },
      },
    });

    // Generate production requirements
    // Use unknown cast since script types don't perfectly align between DB and AI types
    const productionReqs = await generateProductionRequirements({
      script: {
        ...savedScript,
        content: generatedScript.content,
        aspectRatios: generatedScript.aspectRatios,
        textOverlays: generatedScript.textOverlays,
      } as unknown as Parameters<typeof generateProductionRequirements>[0]["script"],
      concept,
      product,
    });

    // Save production requirements (serialize for SQLite)
    const savedProductionReq = await db.productionRequirement.create({
      data: {
        scriptId: savedScript.id,
        locationType: productionReqs.locationType,
        talentNeeded: productionReqs.talentNeeded,
        propsRequired: JSON.stringify(productionReqs.propsRequired),
        productSamples: productionReqs.productSamples,
        sampleQuantity: productionReqs.sampleQuantity,
        equipmentNotes: productionReqs.equipmentNotes,
        frameRate: productionReqs.frameRate,
        audioType: JSON.stringify(productionReqs.audioType),
        styleReference: productionReqs.styleReference,
        transitions: productionReqs.transitions,
        colorGrade: productionReqs.colorGrade,
        musicStyle: productionReqs.musicStyle,
        deliverables: JSON.stringify(productionReqs.deliverables),
      },
    });

    return NextResponse.json({
      success: true,
      script: savedScript,
      productionRequirements: savedProductionReq,
      estimatedTime: {
        shooting: productionReqs.estimatedShootingTime,
        editing: productionReqs.estimatedEditingTime,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to generate script:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to generate script", details: errorMessage },
      { status: 500 }
    );
  }
}
