import { db } from "@/lib/db";

interface ProductionRequirement {
  locationType: string;
  talentNeeded: string;
  propsRequired: string;
  productSamples: boolean;
  sampleQuantity: number | null;
  equipmentNotes: string | null;
  frameRate: number;
  audioType: string;
  styleReference: string | null;
  transitions: string | null;
  colorGrade: string | null;
  musicStyle: string | null;
  deliverables: string;
}

interface Script {
  id: string;
  duration: number;
  aspectRatios: string;
  productionReq: ProductionRequirement | null;
}

interface GeneratedTask {
  type: string;
  scriptId: string;
  estimatedTime: number;
  notes: string;
  status: string;
}

/**
 * Generates production tasks when a script is approved.
 * Creates tasks based on the script's production requirements.
 */
export async function generateProductionTasks(script: Script): Promise<void> {
  const tasks: GeneratedTask[] = [];
  const prodReq = script.productionReq;

  // Parse deliverables and aspect ratios
  let deliverables: Record<string, unknown> = {};
  let aspectRatios: string[] = [];

  try {
    deliverables = JSON.parse(prodReq?.deliverables || "{}");
    aspectRatios = JSON.parse(script.aspectRatios || "[]");
  } catch {
    // Use defaults if parsing fails
  }

  // 1. FILMING task - based on location, talent, props
  const filmingNotes: string[] = [];
  if (prodReq) {
    filmingNotes.push(`Location: ${prodReq.locationType}`);
    filmingNotes.push(`Talent: ${prodReq.talentNeeded}`);

    try {
      const props = JSON.parse(prodReq.propsRequired || "[]");
      if (props.length > 0) {
        filmingNotes.push(`Props: ${props.join(", ")}`);
      }
    } catch {
      // Skip if parsing fails
    }

    if (prodReq.productSamples) {
      filmingNotes.push(`Product samples needed: ${prodReq.sampleQuantity || "TBD"}`);
    }
    if (prodReq.equipmentNotes) {
      filmingNotes.push(`Equipment: ${prodReq.equipmentNotes}`);
    }
  }

  // Estimate filming time: base 2 hours + 1 hour per 30 seconds of content
  const filmingTime = Math.max(2, Math.ceil(script.duration / 30) + 1);

  tasks.push({
    type: "FILMING",
    scriptId: script.id,
    estimatedTime: filmingTime,
    notes: filmingNotes.length > 0
      ? filmingNotes.join("\n")
      : "Filming task for approved script",
    status: "QUEUED",
  });

  // 2. EDITING task - based on duration, complexity, deliverables
  const editingNotes: string[] = [];
  editingNotes.push(`Duration: ${script.duration} seconds`);

  if (prodReq) {
    if (prodReq.colorGrade) {
      editingNotes.push(`Color grade: ${prodReq.colorGrade}`);
    }
    if (prodReq.transitions) {
      editingNotes.push(`Transitions: ${prodReq.transitions}`);
    }
    if (prodReq.musicStyle) {
      editingNotes.push(`Music style: ${prodReq.musicStyle}`);
    }
    if (prodReq.styleReference) {
      editingNotes.push(`Style reference: ${prodReq.styleReference}`);
    }
  }

  if (aspectRatios.length > 0) {
    editingNotes.push(`Aspect ratios: ${aspectRatios.join(", ")}`);
  }

  // Estimate editing time: 3x the video duration in hours, minimum 2 hours
  // Plus extra time for multiple aspect ratios
  const baseEditingTime = Math.max(2, Math.ceil((script.duration / 60) * 3));
  const aspectRatioMultiplier = Math.max(1, aspectRatios.length * 0.5);
  const editingTime = Math.ceil(baseEditingTime * aspectRatioMultiplier);

  tasks.push({
    type: "EDITING",
    scriptId: script.id,
    estimatedTime: editingTime,
    notes: editingNotes.join("\n"),
    status: "QUEUED",
  });

  // 3. REVIEW task - internal review of the edit
  tasks.push({
    type: "REVIEW",
    scriptId: script.id,
    estimatedTime: 1,
    notes: "Review edited video for quality, brand alignment, and script accuracy",
    status: "QUEUED",
  });

  // 4. DELIVERY task - final export and delivery
  const deliveryNotes: string[] = [];
  deliveryNotes.push("Export final videos for all platforms");

  if (aspectRatios.length > 0) {
    deliveryNotes.push(`Formats: ${aspectRatios.join(", ")}`);
  }

  if (Object.keys(deliverables).length > 0) {
    deliveryNotes.push(`Deliverables: ${JSON.stringify(deliverables)}`);
  }

  // Estimate delivery time: 0.5 hours per aspect ratio, minimum 1 hour
  const deliveryTime = Math.max(1, Math.ceil(aspectRatios.length * 0.5));

  tasks.push({
    type: "DELIVERY",
    scriptId: script.id,
    estimatedTime: deliveryTime,
    notes: deliveryNotes.join("\n"),
    status: "QUEUED",
  });

  // Create all tasks in the database
  await db.task.createMany({
    data: tasks,
  });
}

/**
 * Check if tasks already exist for a script
 */
export async function hasExistingTasks(scriptId: string): Promise<boolean> {
  const count = await db.task.count({
    where: { scriptId },
  });
  return count > 0;
}
