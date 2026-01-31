import Anthropic from "@anthropic-ai/sdk";
import type { Product, ICP, Concept, Script } from "@prisma/client";
import type { GeneratedConcept, ScriptContent, ScriptSection } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// Concept Generation (US-110)
// ============================================

interface CompanyProfileContext {
  name: string;
  industry: string | null;
  narrative: string;
  toneDescription: string | null;
  toneSamples: string[];
  values: string[];
  voiceDos: string[];
  voiceDonts: string[];
}

interface ConceptGenerationParams {
  product: Product;
  icp: ICP;
  companyProfile?: CompanyProfileContext;
  formatPreferences: string[];
  hookTypes: string[];
  anglePreferences: string[];
  trends?: string;
  count: number;
}

export async function generateConcepts(
  params: ConceptGenerationParams
): Promise<GeneratedConcept[]> {
  const {
    product,
    icp,
    companyProfile,
    formatPreferences,
    hookTypes,
    anglePreferences,
    trends,
    count,
  } = params;

  const prompt = buildConceptPrompt(
    product,
    icp,
    companyProfile,
    formatPreferences,
    hookTypes,
    anglePreferences,
    trends,
    count
  );

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    system: CONCEPT_GENERATION_SYSTEM_PROMPT,
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  return parseConceptsResponse(textContent.text);
}

const CONCEPT_GENERATION_SYSTEM_PROMPT = `You are an expert creative strategist specializing in performance marketing and direct-response advertising. You create compelling ad concepts that drive conversions.

Your concepts are data-driven, combining proven patterns from winning ads with fresh creative approaches. You understand platform-specific best practices for Meta, TikTok, and YouTube.

When generating concepts, you:
1. Focus on the target audience's pain points and desires
2. Use proven hook patterns that stop the scroll
3. Match formats to platforms appropriately
4. Consider production complexity realistically
5. Provide clear rationale for why each concept will work

Always respond with valid JSON in the exact format requested.`;

function buildConceptPrompt(
  product: Product,
  icp: ICP,
  companyProfile: CompanyProfileContext | undefined,
  formats: string[],
  hooks: string[],
  angles: string[],
  trends: string | undefined,
  count: number
): string {
  const demographics = icp.demographics as Record<string, unknown>;
  const psychographics = icp.psychographics as Record<string, unknown>;

  let brandSection = "";
  if (companyProfile) {
    brandSection = `
## BRAND CONTEXT
Company: ${companyProfile.name}
${companyProfile.industry ? `Industry: ${companyProfile.industry}` : ""}
Brand Narrative: ${companyProfile.narrative}
${companyProfile.toneDescription ? `Tone & Voice: ${companyProfile.toneDescription}` : ""}
${companyProfile.toneSamples.length > 0 ? `Sample Copy Style:\n${companyProfile.toneSamples.map(s => `- "${s}"`).join("\n")}` : ""}
${companyProfile.values.length > 0 ? `Brand Values: ${companyProfile.values.join(", ")}` : ""}
${companyProfile.voiceDos.length > 0 ? `Voice Guidelines - DO: ${companyProfile.voiceDos.join("; ")}` : ""}
${companyProfile.voiceDonts.length > 0 ? `Voice Guidelines - DON'T: ${companyProfile.voiceDonts.join("; ")}` : ""}

IMPORTANT: All concepts must align with this brand voice, values, and tone. The copy style should match the sample copy provided.
`;
  }

  return `Generate ${count} distinct ad concepts for the following product and target audience.
${brandSection}
## PRODUCT
Name: ${product.name}
Description: ${product.description}
Key Features: ${product.features.join(", ")}
Unique Selling Points: ${product.usps.join(", ")}
${product.pricePoint ? `Price Point: ${product.pricePoint}` : ""}
${product.offers ? `Current Offers: ${product.offers}` : ""}

## TARGET AUDIENCE (ICP)
Name: ${icp.name}
Demographics: ${JSON.stringify(demographics, null, 2)}
Psychographics: ${JSON.stringify(psychographics, null, 2)}
Pain Points: ${icp.painPoints.join(", ")}
Aspirations: ${icp.aspirations.join(", ")}
Buying Triggers: ${icp.buyingTriggers.join(", ")}
Preferred Platforms: ${icp.platforms.join(", ")}

## CONSTRAINTS
Formats to explore: ${formats.length > 0 ? formats.join(", ") : "Any"}
Hook types to use: ${hooks.length > 0 ? hooks.join(", ") : "Any"}
Angles to consider: ${angles.length > 0 ? angles.join(", ") : "Any"}
${trends ? `Current Trends/Context: ${trends}` : ""}

## OUTPUT FORMAT
Respond with a JSON object containing exactly ${count} concepts:

{
  "concepts": [
    {
      "title": "Short, descriptive title for the concept",
      "hookType": "The type of hook used (Question, Statement, Controversial, Curiosity, Pain Point)",
      "hookText": "The actual opening line/hook text",
      "angle": "The primary angle (Feature-focused, Benefit-focused, Problem-solution, Social proof, Scarcity, Lifestyle)",
      "format": "Ad format (UGC Testimonial, Product Demo, Before/After, Problem-Solution, Unboxing, Tutorial, Lifestyle)",
      "platform": "Primary platform (Meta, TikTok, YouTube)",
      "coreMessage": "1-2 sentence summary of the core message",
      "rationale": "Why this concept will resonate with the target audience",
      "complexity": "LOW, MEDIUM, or HIGH based on production requirements"
    }
  ]
}

Generate diverse concepts that explore different combinations of hooks, angles, and formats.`;
}

function parseConceptsResponse(response: string): GeneratedConcept[] {
  let jsonStr = response;

  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());
    const conceptsArray = Array.isArray(parsed) ? parsed : parsed.concepts;

    if (!Array.isArray(conceptsArray)) {
      throw new Error("Response is not an array of concepts");
    }

    return conceptsArray.map((c: Record<string, unknown>) => ({
      title: String(c.title || "Untitled Concept"),
      hookType: String(c.hookType || "Statement"),
      hookText: String(c.hookText || ""),
      angle: String(c.angle || "Benefit-focused"),
      format: String(c.format || "Product Demo"),
      platform: String(c.platform || "Meta"),
      coreMessage: String(c.coreMessage || ""),
      rationale: String(c.rationale || ""),
      complexity: validateComplexity(c.complexity),
    }));
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    console.error("Raw response:", response);
    throw new Error("Failed to parse AI-generated concepts");
  }
}

function validateComplexity(value: unknown): "LOW" | "MEDIUM" | "HIGH" {
  const str = String(value).toUpperCase();
  if (str === "LOW" || str === "MEDIUM" || str === "HIGH") {
    return str;
  }
  return "MEDIUM";
}

// ============================================
// Concept Regeneration (US-111)
// ============================================

interface ConceptRegenerationParams {
  concept: Concept;
  product: Product;
  icp: ICP;
  feedback: string;
}

export async function regenerateConcept(
  params: ConceptRegenerationParams
): Promise<GeneratedConcept> {
  const { concept, product, icp, feedback } = params;

  const prompt = `You previously generated this ad concept:

## ORIGINAL CONCEPT
Title: ${concept.title}
Hook Type: ${concept.hookType}
Hook Text: ${concept.hookText || "N/A"}
Angle: ${concept.angle}
Format: ${concept.format}
Platform: ${concept.platform}
Core Message: ${concept.coreMessage}
Rationale: ${concept.rationale || "N/A"}
Complexity: ${concept.complexity}

## PRODUCT CONTEXT
Name: ${product.name}
Description: ${product.description}
Key Features: ${product.features.join(", ")}
USPs: ${product.usps.join(", ")}

## TARGET AUDIENCE
Name: ${icp.name}
Pain Points: ${icp.painPoints.join(", ")}
Aspirations: ${icp.aspirations.join(", ")}

## REVISION FEEDBACK
${feedback}

## TASK
Generate an improved version of this concept based on the feedback. Keep what works, but address the specific feedback provided.

Respond with a JSON object:
{
  "title": "...",
  "hookType": "...",
  "hookText": "...",
  "angle": "...",
  "format": "...",
  "platform": "...",
  "coreMessage": "...",
  "rationale": "Why this revised concept is better",
  "complexity": "LOW/MEDIUM/HIGH"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
    system: CONCEPT_GENERATION_SYSTEM_PROMPT,
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  const concepts = parseConceptsResponse(`{"concepts": [${textContent.text}]}`);
  return concepts[0];
}

// ============================================
// Script Generation (US-201)
// ============================================

interface ScriptGenerationParams {
  concept: Concept;
  product: Product;
  icp: ICP;
  duration: number; // seconds
  aspectRatios: string[];
  platform: string;
  templateStructure?: Record<string, unknown>;
}

export interface GeneratedScript {
  content: ScriptContent;
  duration: number;
  aspectRatios: string[];
  textOverlays: Array<{
    timing: string;
    text: string;
    position: "top" | "center" | "bottom";
  }>;
  productionNotes: {
    locationType: string;
    talentNeeded: string;
    propsRequired: string[];
    equipmentNotes: string;
    audioType: string[];
    styleReference: string;
    colorGrade: string;
  };
}

export async function generateScript(
  params: ScriptGenerationParams
): Promise<GeneratedScript> {
  const { concept, product, icp, duration, aspectRatios, platform, templateStructure } = params;

  const prompt = buildScriptPrompt(concept, product, icp, duration, aspectRatios, platform, templateStructure);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    system: SCRIPT_GENERATION_SYSTEM_PROMPT,
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  return parseScriptResponse(textContent.text, duration, aspectRatios);
}

const SCRIPT_GENERATION_SYSTEM_PROMPT = `You are an experienced direct-response copywriter and video ad scriptwriter. You create compelling, conversion-focused scripts for social media advertising.

Your scripts are:
1. Structured with clear timing for each section
2. Written with specific hooks that stop the scroll
3. Focused on benefits and emotional triggers
4. Include detailed visual direction for production
5. Optimized for the target platform

You understand the pacing requirements for different ad durations (15s, 30s, 60s) and how to adapt content for vertical vs horizontal formats.

Always respond with valid JSON in the exact format requested.`;

function buildScriptPrompt(
  concept: Concept,
  product: Product,
  icp: ICP,
  duration: number,
  aspectRatios: string[],
  platform: string,
  templateStructure?: Record<string, unknown>
): string {
  const demographics = icp.demographics as Record<string, unknown>;

  return `Write a complete video ad script based on this approved concept.

## CONCEPT
Title: ${concept.title}
Hook Type: ${concept.hookType}
Hook Text: ${concept.hookText || "Create an appropriate hook"}
Angle: ${concept.angle}
Format: ${concept.format}
Core Message: ${concept.coreMessage}
Complexity: ${concept.complexity}

## PRODUCT
Name: ${product.name}
Description: ${product.description}
Key Features: ${product.features.join(", ")}
USPs: ${product.usps.join(", ")}
${product.pricePoint ? `Price: ${product.pricePoint}` : ""}
${product.offers ? `Offer: ${product.offers}` : ""}

## TARGET AUDIENCE
${icp.name}
Demographics: ${JSON.stringify(demographics)}
Pain Points: ${icp.painPoints.join(", ")}
Aspirations: ${icp.aspirations.join(", ")}

## REQUIREMENTS
- Duration: ${duration} seconds
- Platform: ${platform}
- Aspect Ratios: ${aspectRatios.join(", ")}
${templateStructure ? `- Template Structure: ${JSON.stringify(templateStructure)}` : ""}

## OUTPUT FORMAT
Respond with a JSON object:

{
  "content": {
    "hook": {
      "name": "Hook",
      "startTime": 0,
      "endTime": 3,
      "spokenText": "The spoken/VO text for this section",
      "visualDirection": "What should be shown on screen",
      "textOverlay": "Text to display on screen (optional)",
      "transition": "cut/dissolve/zoom"
    },
    "problemSetup": {
      "name": "Problem/Setup",
      "startTime": 3,
      "endTime": 8,
      "spokenText": "...",
      "visualDirection": "...",
      "textOverlay": "...",
      "transition": "..."
    },
    "solution": {
      "name": "Solution/Body",
      "startTime": 8,
      "endTime": ${Math.floor(duration * 0.6)},
      "spokenText": "...",
      "visualDirection": "...",
      "textOverlay": "...",
      "transition": "..."
    },
    "proof": {
      "name": "Proof/Support",
      "startTime": ${Math.floor(duration * 0.6)},
      "endTime": ${Math.floor(duration * 0.8)},
      "spokenText": "...",
      "visualDirection": "...",
      "textOverlay": "...",
      "transition": "..."
    },
    "cta": {
      "name": "Call-to-Action",
      "startTime": ${Math.floor(duration * 0.8)},
      "endTime": ${Math.floor(duration * 0.93)},
      "spokenText": "...",
      "visualDirection": "...",
      "textOverlay": "...",
      "transition": "..."
    },
    "closing": {
      "name": "Closing",
      "startTime": ${Math.floor(duration * 0.93)},
      "endTime": ${duration},
      "spokenText": "...",
      "visualDirection": "...",
      "textOverlay": "...",
      "transition": "..."
    }
  },
  "textOverlays": [
    { "timing": "0-3s", "text": "Hook text overlay", "position": "center" },
    { "timing": "3-8s", "text": "...", "position": "bottom" }
  ],
  "productionNotes": {
    "locationType": "Studio/On-location/Home/Mixed",
    "talentNeeded": "None/Actor/UGC Creator/Product only",
    "propsRequired": ["prop1", "prop2"],
    "equipmentNotes": "Any special equipment needed",
    "audioType": ["VO", "Music", "SFX"],
    "styleReference": "Visual style description",
    "colorGrade": "Bright/Moody/Natural/Brand-specific"
  }
}

Make the script compelling, specific to the product, and optimized for ${platform}. Ensure timing adds up to ${duration} seconds.`;
}

function parseScriptResponse(
  response: string,
  duration: number,
  aspectRatios: string[]
): GeneratedScript {
  let jsonStr = response;

  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());

    // Transform the content sections
    const content: ScriptContent = {
      hook: parseSection(parsed.content?.hook),
      problemSetup: parseSection(parsed.content?.problemSetup),
      solution: parseSection(parsed.content?.solution),
      proof: parsed.content?.proof ? parseSection(parsed.content.proof) : undefined,
      cta: parseSection(parsed.content?.cta),
      closing: parseSection(parsed.content?.closing),
    };

    return {
      content,
      duration,
      aspectRatios,
      textOverlays: (parsed.textOverlays || []).map((o: Record<string, unknown>) => ({
        timing: String(o.timing || ""),
        text: String(o.text || ""),
        position: validatePosition(o.position),
      })),
      productionNotes: {
        locationType: String(parsed.productionNotes?.locationType || "Studio"),
        talentNeeded: String(parsed.productionNotes?.talentNeeded || "None"),
        propsRequired: Array.isArray(parsed.productionNotes?.propsRequired)
          ? parsed.productionNotes.propsRequired.map(String)
          : [],
        equipmentNotes: String(parsed.productionNotes?.equipmentNotes || ""),
        audioType: Array.isArray(parsed.productionNotes?.audioType)
          ? parsed.productionNotes.audioType.map(String)
          : ["VO", "Music"],
        styleReference: String(parsed.productionNotes?.styleReference || ""),
        colorGrade: String(parsed.productionNotes?.colorGrade || "Natural"),
      },
    };
  } catch (error) {
    console.error("Failed to parse script response:", error);
    console.error("Raw response:", response);
    throw new Error("Failed to parse AI-generated script");
  }
}

function parseSection(section: Record<string, unknown> | undefined): ScriptSection {
  return {
    name: String(section?.name || "Section"),
    startTime: Number(section?.startTime || 0),
    endTime: Number(section?.endTime || 0),
    spokenText: String(section?.spokenText || ""),
    visualDirection: String(section?.visualDirection || ""),
    textOverlay: section?.textOverlay ? String(section.textOverlay) : undefined,
    transition: section?.transition ? String(section.transition) : undefined,
  };
}

function validatePosition(value: unknown): "top" | "center" | "bottom" {
  const str = String(value).toLowerCase();
  if (str === "top" || str === "center" || str === "bottom") {
    return str;
  }
  return "bottom";
}

// ============================================
// Script Revision (US-211)
// ============================================

interface ScriptRevisionParams {
  script: Script;
  concept: Concept;
  product: Product;
  sectionToRevise: string; // "hook", "problemSetup", "solution", "proof", "cta", "closing"
  feedback: string;
}

export async function reviseScriptSection(
  params: ScriptRevisionParams
): Promise<ScriptSection> {
  const { script, concept, product, sectionToRevise, feedback } = params;

  const scriptContent = script.content as Record<string, unknown>;
  const currentSection = scriptContent[sectionToRevise] as Record<string, unknown>;

  const prompt = `You need to revise a specific section of a video ad script.

## CONTEXT
Product: ${product.name}
Concept: ${concept.title}
Core Message: ${concept.coreMessage}

## CURRENT SECTION: ${sectionToRevise}
${JSON.stringify(currentSection, null, 2)}

## REVISION FEEDBACK
${feedback}

## TASK
Rewrite this section based on the feedback. Maintain the same timing (startTime: ${currentSection?.startTime}, endTime: ${currentSection?.endTime}).

Respond with a JSON object:
{
  "name": "${currentSection?.name || sectionToRevise}",
  "startTime": ${currentSection?.startTime || 0},
  "endTime": ${currentSection?.endTime || 5},
  "spokenText": "The revised spoken/VO text",
  "visualDirection": "Updated visual direction",
  "textOverlay": "Updated text overlay (if any)",
  "transition": "cut/dissolve/zoom"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    system: SCRIPT_GENERATION_SYSTEM_PROMPT,
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  let jsonStr = textContent.text;
  const jsonMatch = textContent.text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());
    return parseSection(parsed);
  } catch (error) {
    console.error("Failed to parse revision response:", error);
    throw new Error("Failed to parse AI-generated revision");
  }
}

// ============================================
// Production Requirements Generation
// ============================================

interface ProductionRequirementsParams {
  script: Script;
  concept: Concept;
  product: Product;
}

export interface GeneratedProductionRequirements {
  locationType: string;
  talentNeeded: string;
  propsRequired: string[];
  productSamples: boolean;
  sampleQuantity: number;
  equipmentNotes: string;
  frameRate: number;
  audioType: string[];
  styleReference: string;
  transitions: string;
  colorGrade: string;
  musicStyle: string;
  deliverables: {
    aspectRatio: string;
    withCaptions: boolean;
    withoutCaptions: boolean;
  }[];
  estimatedShootingTime: number; // minutes
  estimatedEditingTime: number; // minutes
}

export async function generateProductionRequirements(
  params: ProductionRequirementsParams
): Promise<GeneratedProductionRequirements> {
  const { script, concept, product } = params;

  const prompt = `Analyze this video ad script and generate detailed production requirements.

## SCRIPT
${JSON.stringify(script.content, null, 2)}

## CONCEPT
Format: ${concept.format}
Complexity: ${concept.complexity}
Platform: ${concept.platform}

## PRODUCT
Name: ${product.name}
Description: ${product.description}

## TECHNICAL SPECS
Duration: ${script.duration} seconds
Aspect Ratios: ${script.aspectRatios.join(", ")}

## TASK
Generate comprehensive production requirements. Consider the script content, format type, and complexity level.

Respond with JSON:
{
  "locationType": "Studio/On-location/Home/Mixed",
  "talentNeeded": "None/Actor/UGC Creator/Product only/Multiple",
  "propsRequired": ["list", "of", "props"],
  "productSamples": true/false,
  "sampleQuantity": 1,
  "equipmentNotes": "Camera, lighting, and audio equipment needs",
  "frameRate": 30,
  "audioType": ["VO", "Music", "SFX", "Sync sound"],
  "styleReference": "Visual style description",
  "transitions": "Primary transition style",
  "colorGrade": "Color grading style",
  "musicStyle": "Music genre/mood",
  "deliverables": [
    { "aspectRatio": "9:16", "withCaptions": true, "withoutCaptions": true },
    { "aspectRatio": "1:1", "withCaptions": true, "withoutCaptions": false }
  ],
  "estimatedShootingTime": 45,
  "estimatedEditingTime": 60
}

Base time estimates on complexity: LOW (30min shoot/45min edit), MEDIUM (60min/90min), HIGH (120min/180min).`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
    system: "You are a production coordinator for video advertising. Generate accurate, detailed production requirements based on scripts. Always respond with valid JSON.",
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  let jsonStr = textContent.text;
  const jsonMatch = textContent.text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());
    return {
      locationType: String(parsed.locationType || "Studio"),
      talentNeeded: String(parsed.talentNeeded || "None"),
      propsRequired: Array.isArray(parsed.propsRequired) ? parsed.propsRequired.map(String) : [],
      productSamples: Boolean(parsed.productSamples),
      sampleQuantity: Number(parsed.sampleQuantity || 1),
      equipmentNotes: String(parsed.equipmentNotes || ""),
      frameRate: Number(parsed.frameRate || 30),
      audioType: Array.isArray(parsed.audioType) ? parsed.audioType.map(String) : ["VO", "Music"],
      styleReference: String(parsed.styleReference || ""),
      transitions: String(parsed.transitions || "cut"),
      colorGrade: String(parsed.colorGrade || "Natural"),
      musicStyle: String(parsed.musicStyle || ""),
      deliverables: Array.isArray(parsed.deliverables)
        ? parsed.deliverables.map((d: Record<string, unknown>) => ({
            aspectRatio: String(d.aspectRatio || "9:16"),
            withCaptions: Boolean(d.withCaptions),
            withoutCaptions: Boolean(d.withoutCaptions),
          }))
        : [{ aspectRatio: "9:16", withCaptions: true, withoutCaptions: true }],
      estimatedShootingTime: Number(parsed.estimatedShootingTime || 45),
      estimatedEditingTime: Number(parsed.estimatedEditingTime || 60),
    };
  } catch (error) {
    console.error("Failed to parse production requirements:", error);
    throw new Error("Failed to generate production requirements");
  }
}

// ============================================
// Ad Template Analysis (Library Feature)
// ============================================

export interface AdTemplateVisualStyle {
  primaryColors: string[];
  aesthetic: string;
  mood: string;
  hasText: boolean;
  hasFaces: boolean;
  hasProduct: boolean;
}

export interface AdTemplateAnalysis {
  suggestedName: string;
  format: string;
  platform: string;
  hookType: string;
  visualStyle: AdTemplateVisualStyle;
  keyFeatures: string[];
  callToAction?: string;
  estimatedDuration?: number;
  confidence: number;
}

interface AdTemplateAnalysisParams {
  imageBase64: string;
  imageMediaType: string;
  sourceUrl?: string;
}

const AD_ANALYSIS_SYSTEM_PROMPT = `You are an expert advertising analyst specializing in digital marketing and performance advertising. You analyze ads to extract key characteristics that define their style and approach.

When analyzing an ad, identify:
1. A descriptive name that captures the ad's essence (3-6 words)
2. The ad format (UGC Testimonial, Product Demo, Before/After, Problem-Solution, Unboxing, Tutorial, Lifestyle, Talking Head, Slideshow, Animation)
3. The target platform based on aspect ratio and style (Meta, TikTok, YouTube, Instagram, Pinterest)
4. The hook type used (Question, Statement, Controversial, Curiosity, Pain Point, Social Proof, Statistic)
5. Visual style elements (colors, aesthetic, mood)
6. Key features that make this ad effective
7. Any visible call-to-action

Always respond with valid JSON in the exact format requested.`;

export async function analyzeAdTemplate(
  params: AdTemplateAnalysisParams
): Promise<AdTemplateAnalysis> {
  const { imageBase64, imageMediaType, sourceUrl } = params;

  const prompt = `Analyze this advertisement image and extract its key characteristics.

${sourceUrl ? `Source URL: ${sourceUrl}` : ""}

Respond with a JSON object in this exact format:
{
  "suggestedName": "A descriptive 3-6 word name for this ad style",
  "format": "One of: UGC Testimonial, Product Demo, Before/After, Problem-Solution, Unboxing, Tutorial, Lifestyle, Talking Head, Slideshow, Animation",
  "platform": "One of: Meta, TikTok, YouTube, Instagram, Pinterest",
  "hookType": "One of: Question, Statement, Controversial, Curiosity, Pain Point, Social Proof, Statistic",
  "visualStyle": {
    "primaryColors": ["color1", "color2"],
    "aesthetic": "modern/minimalist/bold/playful/professional/casual/luxurious/raw",
    "mood": "energetic/calm/urgent/friendly/serious/inspiring/humorous",
    "hasText": true/false,
    "hasFaces": true/false,
    "hasProduct": true/false
  },
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "callToAction": "The CTA text if visible, or null",
  "estimatedDuration": null,
  "confidence": 0.0-1.0
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
    system: AD_ANALYSIS_SYSTEM_PROMPT,
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  return parseAdAnalysisResponse(textContent.text);
}

function parseAdAnalysisResponse(response: string): AdTemplateAnalysis {
  let jsonStr = response;

  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());

    return {
      suggestedName: String(parsed.suggestedName || "Untitled Ad"),
      format: String(parsed.format || "Product Demo"),
      platform: String(parsed.platform || "Meta"),
      hookType: String(parsed.hookType || "Statement"),
      visualStyle: {
        primaryColors: Array.isArray(parsed.visualStyle?.primaryColors)
          ? parsed.visualStyle.primaryColors.map(String)
          : [],
        aesthetic: String(parsed.visualStyle?.aesthetic || "modern"),
        mood: String(parsed.visualStyle?.mood || "neutral"),
        hasText: Boolean(parsed.visualStyle?.hasText),
        hasFaces: Boolean(parsed.visualStyle?.hasFaces),
        hasProduct: Boolean(parsed.visualStyle?.hasProduct),
      },
      keyFeatures: Array.isArray(parsed.keyFeatures)
        ? parsed.keyFeatures.map(String)
        : [],
      callToAction: parsed.callToAction ? String(parsed.callToAction) : undefined,
      estimatedDuration: parsed.estimatedDuration
        ? Number(parsed.estimatedDuration)
        : undefined,
      confidence: Number(parsed.confidence || 0.7),
    };
  } catch (error) {
    console.error("Failed to parse ad analysis response:", error);
    console.error("Raw response:", response);
    throw new Error("Failed to parse AI-generated ad analysis");
  }
}
