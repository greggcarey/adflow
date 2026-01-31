import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateConcepts } from "@/lib/ai";
import { z } from "zod";

const generateSchema = z.object({
  productId: z.string().uuid(),
  icpId: z.string().uuid(),
  formatPreferences: z.array(z.string()).optional().default([]),
  hookTypes: z.array(z.string()).optional().default([]),
  anglePreferences: z.array(z.string()).optional().default([]),
  trends: z.string().optional(),
  count: z.number().min(1).max(10).default(5),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = generateSchema.parse(body);

    // Fetch product, ICP, and company profile
    const [productRaw, icpRaw, companyProfileRaw] = await Promise.all([
      db.product.findUnique({ where: { id: data.productId } }),
      db.iCP.findUnique({ where: { id: data.icpId } }),
      db.companyProfile.findFirst(),
    ]);

    if (!productRaw) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!icpRaw) {
      return NextResponse.json({ error: "ICP not found" }, { status: 404 });
    }

    // Parse JSON strings for SQLite compatibility
    const product = {
      ...productRaw,
      features: JSON.parse(productRaw.features),
      usps: JSON.parse(productRaw.usps),
      imageUrls: JSON.parse(productRaw.imageUrls),
    };

    const icp = {
      ...icpRaw,
      demographics: JSON.parse(icpRaw.demographics),
      psychographics: JSON.parse(icpRaw.psychographics),
      painPoints: JSON.parse(icpRaw.painPoints),
      aspirations: JSON.parse(icpRaw.aspirations),
      buyingTriggers: JSON.parse(icpRaw.buyingTriggers),
      platforms: JSON.parse(icpRaw.platforms),
    };

    // Parse company profile if exists
    const companyProfile = companyProfileRaw
      ? {
          name: companyProfileRaw.name,
          industry: companyProfileRaw.industry,
          narrative: companyProfileRaw.narrative,
          toneDescription: companyProfileRaw.toneDescription,
          toneSamples: JSON.parse(companyProfileRaw.toneSamples),
          values: JSON.parse(companyProfileRaw.values),
          voiceDos: JSON.parse(companyProfileRaw.voiceDos),
          voiceDonts: JSON.parse(companyProfileRaw.voiceDonts),
        }
      : undefined;

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured. Please set ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    // Generate concepts using AI
    const generatedConcepts = await generateConcepts({
      product,
      icp,
      companyProfile,
      formatPreferences: data.formatPreferences,
      hookTypes: data.hookTypes,
      anglePreferences: data.anglePreferences,
      trends: data.trends,
      count: data.count,
    });

    // Save concepts to database
    const savedConcepts = await Promise.all(
      generatedConcepts.map((concept) =>
        db.concept.create({
          data: {
            title: concept.title,
            hookType: concept.hookType,
            hookText: concept.hookText,
            angle: concept.angle,
            format: concept.format,
            platform: concept.platform,
            coreMessage: concept.coreMessage,
            rationale: concept.rationale,
            complexity: concept.complexity,
            status: "GENERATED",
            productId: data.productId,
            icpId: data.icpId,
          },
          include: {
            product: { select: { name: true } },
            icp: { select: { name: true } },
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      concepts: savedConcepts,
      count: savedConcepts.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to generate concepts:", error);

    // Return more specific error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to generate concepts", details: errorMessage },
      { status: 500 }
    );
  }
}
