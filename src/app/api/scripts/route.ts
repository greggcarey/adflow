import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (conceptId) where.conceptId = conceptId;
    if (status) where.status = status;

    const scripts = await db.script.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { version: "desc" }],
      include: {
        concept: {
          select: {
            id: true,
            title: true,
            format: true,
            platform: true,
            complexity: true,
            product: { select: { id: true, name: true } },
            icp: { select: { id: true, name: true } },
          },
        },
        productionReq: true,
        approvedBy: { select: { id: true, name: true } },
        _count: {
          select: { tasks: true },
        },
      },
    });

    // Parse JSON strings for SQLite
    const parsed = scripts.map((s) => ({
      ...s,
      content: JSON.parse(s.content),
      aspectRatios: JSON.parse(s.aspectRatios),
      textOverlays: JSON.parse(s.textOverlays),
      productionReq: s.productionReq ? {
        ...s.productionReq,
        propsRequired: JSON.parse(s.productionReq.propsRequired),
        audioType: JSON.parse(s.productionReq.audioType),
        deliverables: JSON.parse(s.productionReq.deliverables),
      } : null,
      taskCount: s._count.tasks,
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch scripts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
