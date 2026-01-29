import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");
    const icpId = searchParams.get("icpId");
    const format = searchParams.get("format");
    const complexity = searchParams.get("complexity");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (icpId) where.icpId = icpId;
    if (format) where.format = format;
    if (complexity) where.complexity = complexity;

    const concepts = await db.concept.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        product: { select: { id: true, name: true } },
        icp: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(concepts);
  } catch (error) {
    console.error("Failed to fetch concepts:", error);
    return NextResponse.json(
      { error: "Failed to fetch concepts" },
      { status: 500 }
    );
  }
}
