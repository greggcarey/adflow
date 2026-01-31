import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1),
  sourceType: z.enum(["upload", "url"]),
  sourceUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  fileType: z.enum(["image", "video"]),
  fileMimeType: z.string().optional(),
  fileSize: z.number().optional(),
  format: z.string().min(1),
  platform: z.string().min(1),
  hookType: z.string().min(1),
  visualStyle: z.record(z.unknown()).optional().default({}),
  keyFeatures: z.array(z.string()).optional().default([]),
  aiAnalysis: z.record(z.unknown()).optional().default({}),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const platform = searchParams.get("platform");
    const hookType = searchParams.get("hookType");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};

    if (format) {
      where.format = format;
    }
    if (platform) {
      where.platform = platform;
    }
    if (hookType) {
      where.hookType = hookType;
    }
    if (search) {
      where.name = { contains: search };
    }

    const [templates, total] = await Promise.all([
      db.adTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.adTemplate.count({ where }),
    ]);

    // Parse JSON fields
    const parsed = templates.map((t) => ({
      ...t,
      visualStyle: JSON.parse(t.visualStyle),
      keyFeatures: JSON.parse(t.keyFeatures),
      aiAnalysis: JSON.parse(t.aiAnalysis),
      tags: JSON.parse(t.tags),
    }));

    return NextResponse.json({
      templates: parsed,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    const template = await db.adTemplate.create({
      data: {
        name: data.name,
        sourceType: data.sourceType,
        sourceUrl: data.sourceUrl,
        fileUrl: data.fileUrl,
        thumbnailUrl: data.thumbnailUrl,
        fileType: data.fileType,
        fileMimeType: data.fileMimeType,
        fileSize: data.fileSize,
        format: data.format,
        platform: data.platform,
        hookType: data.hookType,
        visualStyle: JSON.stringify(data.visualStyle),
        keyFeatures: JSON.stringify(data.keyFeatures),
        aiAnalysis: JSON.stringify(data.aiAnalysis),
        notes: data.notes,
        tags: JSON.stringify(data.tags),
      },
    });

    return NextResponse.json(
      {
        ...template,
        visualStyle: data.visualStyle,
        keyFeatures: data.keyFeatures,
        aiAnalysis: data.aiAnalysis,
        tags: data.tags,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
