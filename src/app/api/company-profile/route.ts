import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const companyProfileSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  narrative: z.string().min(1),
  toneDescription: z.string().optional(),
  toneSamples: z.array(z.string()).optional().default([]),
  values: z.array(z.string()).optional().default([]),
  voiceDos: z.array(z.string()).optional().default([]),
  voiceDonts: z.array(z.string()).optional().default([]),
});

export async function GET() {
  try {
    const profile = await db.companyProfile.findFirst();

    if (!profile) {
      return NextResponse.json(null);
    }

    // Parse JSON strings for client
    return NextResponse.json({
      ...profile,
      toneSamples: JSON.parse(profile.toneSamples),
      values: JSON.parse(profile.values),
      voiceDos: JSON.parse(profile.voiceDos),
      voiceDonts: JSON.parse(profile.voiceDonts),
    });
  } catch (error) {
    console.error("Failed to fetch company profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if profile already exists
    const existing = await db.companyProfile.findFirst();
    if (existing) {
      return NextResponse.json(
        { error: "Company profile already exists. Use PUT to update." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = companyProfileSchema.parse(body);

    const profile = await db.companyProfile.create({
      data: {
        name: data.name,
        industry: data.industry,
        narrative: data.narrative,
        toneDescription: data.toneDescription,
        toneSamples: JSON.stringify(data.toneSamples),
        values: JSON.stringify(data.values),
        voiceDos: JSON.stringify(data.voiceDos),
        voiceDonts: JSON.stringify(data.voiceDonts),
      },
    });

    return NextResponse.json({
      ...profile,
      toneSamples: data.toneSamples,
      values: data.values,
      voiceDos: data.voiceDos,
      voiceDonts: data.voiceDonts,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create company profile:", error);
    return NextResponse.json(
      { error: "Failed to create company profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const existing = await db.companyProfile.findFirst();
    if (!existing) {
      return NextResponse.json(
        { error: "Company profile not found. Use POST to create." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = companyProfileSchema.parse(body);

    const profile = await db.companyProfile.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        industry: data.industry,
        narrative: data.narrative,
        toneDescription: data.toneDescription,
        toneSamples: JSON.stringify(data.toneSamples),
        values: JSON.stringify(data.values),
        voiceDos: JSON.stringify(data.voiceDos),
        voiceDonts: JSON.stringify(data.voiceDonts),
      },
    });

    return NextResponse.json({
      ...profile,
      toneSamples: data.toneSamples,
      values: data.values,
      voiceDos: data.voiceDos,
      voiceDonts: data.voiceDonts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update company profile:", error);
    return NextResponse.json(
      { error: "Failed to update company profile" },
      { status: 500 }
    );
  }
}
