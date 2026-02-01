import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { del } from "@vercel/blob";
import { z } from "zod";

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  format: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
  hookType: z.string().min(1).optional(),
  visualStyle: z.record(z.string(), z.unknown()).optional(),
  keyFeatures: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await db.adTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...template,
      visualStyle: JSON.parse(template.visualStyle),
      keyFeatures: JSON.parse(template.keyFeatures),
      aiAnalysis: JSON.parse(template.aiAnalysis),
      tags: JSON.parse(template.tags),
    });
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
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
    const data = updateTemplateSchema.parse(body);

    const existing = await db.adTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.platform !== undefined) updateData.platform = data.platform;
    if (data.hookType !== undefined) updateData.hookType = data.hookType;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.visualStyle !== undefined)
      updateData.visualStyle = JSON.stringify(data.visualStyle);
    if (data.keyFeatures !== undefined)
      updateData.keyFeatures = JSON.stringify(data.keyFeatures);
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

    const template = await db.adTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...template,
      visualStyle: JSON.parse(template.visualStyle),
      keyFeatures: JSON.parse(template.keyFeatures),
      aiAnalysis: JSON.parse(template.aiAnalysis),
      tags: JSON.parse(template.tags),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
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

    const template = await db.adTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob if file exists
    if (template.fileUrl) {
      try {
        await del(template.fileUrl);
      } catch (blobError) {
        console.warn("Failed to delete blob file:", blobError);
        // Continue with database deletion even if blob deletion fails
      }
    }

    if (template.thumbnailUrl && template.thumbnailUrl !== template.fileUrl) {
      try {
        await del(template.thumbnailUrl);
      } catch (blobError) {
        console.warn("Failed to delete thumbnail blob:", blobError);
      }
    }

    await db.adTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
