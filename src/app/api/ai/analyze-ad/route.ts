import { NextResponse } from "next/server";
import { analyzeAdTemplate } from "@/lib/ai";
import { z } from "zod";

const analyzeSchema = z.object({
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
  imageMediaType: z.string().optional(),
  sourceUrl: z.string().url().optional(),
}).refine(
  (data) => data.imageUrl || data.imageBase64,
  { message: "Either imageUrl or imageBase64 is required" }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = analyzeSchema.parse(body);

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured. Please set ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    let imageBase64 = data.imageBase64;
    let imageMediaType = data.imageMediaType;

    // If URL provided, fetch and convert to base64
    if (data.imageUrl && !imageBase64) {
      try {
        const imageResponse = await fetch(data.imageUrl);
        if (!imageResponse.ok) {
          return NextResponse.json(
            { error: "Failed to fetch image from URL" },
            { status: 400 }
          );
        }

        const contentType = imageResponse.headers.get("content-type");
        if (!contentType?.startsWith("image/")) {
          return NextResponse.json(
            { error: "URL does not point to a valid image" },
            { status: 400 }
          );
        }

        imageMediaType = contentType;
        const arrayBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      } catch (fetchError) {
        console.error("Error fetching image:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch image from URL" },
          { status: 400 }
        );
      }
    }

    if (!imageBase64 || !imageMediaType) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Analyze the ad
    const analysis = await analyzeAdTemplate({
      imageBase64,
      imageMediaType,
      sourceUrl: data.sourceUrl,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to analyze ad:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to analyze ad", details: errorMessage },
      { status: 500 }
    );
  }
}
