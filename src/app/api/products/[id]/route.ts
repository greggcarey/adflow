import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  features: z.array(z.string()),
  usps: z.array(z.string()),
  pricePoint: z.string().nullable().optional(),
  offers: z.string().nullable().optional(),
  imageUrls: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        concepts: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Parse JSON strings for SQLite
    return NextResponse.json({
      ...product,
      features: JSON.parse(product.features),
      usps: JSON.parse(product.usps),
      imageUrls: JSON.parse(product.imageUrls),
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
    const data = productSchema.parse(body);

    const product = await db.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        features: JSON.stringify(data.features),
        usps: JSON.stringify(data.usps),
        pricePoint: data.pricePoint,
        offers: data.offers,
        imageUrls: JSON.stringify(data.imageUrls || []),
      },
    });

    return NextResponse.json({
      ...product,
      features: data.features,
      usps: data.usps,
      imageUrls: data.imageUrls || [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
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
    await db.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
