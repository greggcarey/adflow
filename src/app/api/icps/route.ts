import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const icpSchema = z.object({
  name: z.string().min(1),
  demographics: z.object({
    ageRange: z.string(),
    gender: z.string(),
    location: z.string(),
    income: z.string(),
  }),
  psychographics: z.object({
    interests: z.array(z.string()),
    values: z.array(z.string()),
    lifestyle: z.string(),
  }),
  painPoints: z.array(z.string()),
  aspirations: z.array(z.string()),
  buyingTriggers: z.array(z.string()),
  platforms: z.array(z.string()),
});

export async function GET() {
  try {
    const icps = await db.iCP.findMany({
      orderBy: { createdAt: "desc" },
    });
    // Parse JSON strings back to objects/arrays for SQLite
    const parsed = icps.map((icp) => ({
      ...icp,
      demographics: JSON.parse(icp.demographics),
      psychographics: JSON.parse(icp.psychographics),
      painPoints: JSON.parse(icp.painPoints),
      aspirations: JSON.parse(icp.aspirations),
      buyingTriggers: JSON.parse(icp.buyingTriggers),
      platforms: JSON.parse(icp.platforms),
    }));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch ICPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch ICPs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = icpSchema.parse(body);

    const icp = await db.iCP.create({
      data: {
        name: data.name,
        demographics: JSON.stringify(data.demographics),
        psychographics: JSON.stringify(data.psychographics),
        painPoints: JSON.stringify(data.painPoints),
        aspirations: JSON.stringify(data.aspirations),
        buyingTriggers: JSON.stringify(data.buyingTriggers),
        platforms: JSON.stringify(data.platforms),
      },
    });

    // Return with parsed data
    return NextResponse.json({
      ...icp,
      demographics: data.demographics,
      psychographics: data.psychographics,
      painPoints: data.painPoints,
      aspirations: data.aspirations,
      buyingTriggers: data.buyingTriggers,
      platforms: data.platforms,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create ICP:", error);
    return NextResponse.json(
      { error: "Failed to create ICP" },
      { status: 500 }
    );
  }
}
