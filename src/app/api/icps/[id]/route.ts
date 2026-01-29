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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const icp = await db.iCP.findUnique({
      where: { id },
      include: {
        concepts: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!icp) {
      return NextResponse.json({ error: "ICP not found" }, { status: 404 });
    }

    // Parse JSON strings for SQLite
    return NextResponse.json({
      ...icp,
      demographics: JSON.parse(icp.demographics),
      psychographics: JSON.parse(icp.psychographics),
      painPoints: JSON.parse(icp.painPoints),
      aspirations: JSON.parse(icp.aspirations),
      buyingTriggers: JSON.parse(icp.buyingTriggers),
      platforms: JSON.parse(icp.platforms),
    });
  } catch (error) {
    console.error("Failed to fetch ICP:", error);
    return NextResponse.json(
      { error: "Failed to fetch ICP" },
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
    const data = icpSchema.parse(body);

    const icp = await db.iCP.update({
      where: { id },
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

    return NextResponse.json({
      ...icp,
      demographics: data.demographics,
      psychographics: data.psychographics,
      painPoints: data.painPoints,
      aspirations: data.aspirations,
      buyingTriggers: data.buyingTriggers,
      platforms: data.platforms,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update ICP:", error);
    return NextResponse.json(
      { error: "Failed to update ICP" },
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
    await db.iCP.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete ICP:", error);
    return NextResponse.json(
      { error: "Failed to delete ICP" },
      { status: 500 }
    );
  }
}
