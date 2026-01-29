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

export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    // Parse JSON strings back to arrays for SQLite
    const parsed = products.map((p) => ({
      ...p,
      features: JSON.parse(p.features),
      usps: JSON.parse(p.usps),
      imageUrls: JSON.parse(p.imageUrls),
    }));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = productSchema.parse(body);

    const product = await db.product.create({
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

    // Return with parsed arrays
    return NextResponse.json({
      ...product,
      features: data.features,
      usps: data.usps,
      imageUrls: data.imageUrls || [],
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
