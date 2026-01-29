// AdFlow TypeScript Types

import type {
  Concept,
  Product,
  ICP,
  Script,
  Task,
  TeamMember,
  HookTemplate,
  FormatTemplate,
  AngleTemplate,
} from "@prisma/client";

// Re-export Prisma types
export type {
  Concept,
  Product,
  ICP,
  Script,
  Task,
  TeamMember,
  HookTemplate,
  FormatTemplate,
  AngleTemplate,
} from "@prisma/client";

// ============================================
// Concept Generation Types
// ============================================

export interface ConceptGenerationInput {
  productId: string;
  icpId: string;
  formatPreferences: string[];
  hookTypes: string[];
  anglePreferences: string[];
  trends?: string;
  count: number;
}

export interface GeneratedConcept {
  title: string;
  hookType: string;
  hookText: string;
  angle: string;
  format: string;
  platform: string;
  coreMessage: string;
  rationale: string;
  complexity: "LOW" | "MEDIUM" | "HIGH";
}

// ============================================
// ICP Types
// ============================================

export interface Demographics {
  ageRange: string;
  gender: string;
  location: string;
  income: string;
}

export interface Psychographics {
  interests: string[];
  values: string[];
  lifestyle: string;
}

// ============================================
// Script Types
// ============================================

export interface ScriptSection {
  name: string;
  startTime: number;
  endTime: number;
  spokenText: string;
  visualDirection: string;
  textOverlay?: string;
  transition?: string;
}

export interface ScriptContent {
  hook: ScriptSection;
  problemSetup: ScriptSection;
  solution: ScriptSection;
  proof?: ScriptSection;
  cta: ScriptSection;
  closing: ScriptSection;
}

export interface TextOverlay {
  timing: string;
  text: string;
  position: "top" | "center" | "bottom";
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Component Props Types
// ============================================

export interface ConceptCardProps {
  concept: Concept & {
    product: Product;
    icp: ICP;
  };
  onStatusChange?: (id: string, status: Concept["status"]) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  features: string[];
  usps: string[];
  pricePoint?: string;
  offers?: string;
  imageUrls: string[];
}

export interface ICPFormData {
  name: string;
  demographics: Demographics;
  psychographics: Psychographics;
  painPoints: string[];
  aspirations: string[];
  buyingTriggers: string[];
  platforms: string[];
}

// ============================================
// Constants for UI
// ============================================

export const CONCEPT_STATUS_LABELS: Record<Concept["status"], string> = {
  GENERATED: "Generated",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REVISION_REQUESTED: "Revision Requested",
  ARCHIVED: "Archived",
  REJECTED: "Rejected",
};

export const CONCEPT_STATUS_COLORS: Record<Concept["status"], string> = {
  GENERATED: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REVISION_REQUESTED: "bg-orange-100 text-orange-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
  REJECTED: "bg-red-100 text-red-800",
};

export const COMPLEXITY_LABELS: Record<Concept["complexity"], string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const COMPLEXITY_COLORS: Record<Concept["complexity"], string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

// ============================================
// Task Types
// ============================================

export type TaskStatus = "QUEUED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";

export type TaskType = "FILMING" | "EDITING" | "REVIEW" | "REVISION" | "DELIVERY";

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string }
> = {
  QUEUED: {
    label: "Queued",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  BLOCKED: {
    label: "Blocked",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
};

export const TASK_TYPE_CONFIG: Record<
  TaskType,
  { label: string; icon: string }
> = {
  FILMING: { label: "Filming", icon: "Video" },
  EDITING: { label: "Editing", icon: "Film" },
  REVIEW: { label: "Review", icon: "Eye" },
  REVISION: { label: "Revision", icon: "RefreshCw" },
  DELIVERY: { label: "Delivery", icon: "Send" },
};

export interface TaskWithRelations extends Task {
  script: {
    id: string;
    version: number;
    concept: {
      id: string;
      title: string;
      product: { name: string };
    };
  };
  assignee: TeamMember | null;
}

export interface TeamMemberWithStats extends TeamMember {
  _count: {
    tasksAssigned: number;
  };
  assignedHours?: number;
}

// ============================================
// Task Form Types
// ============================================

export interface TaskFormData {
  type: TaskType;
  scriptId: string;
  assigneeId?: string;
  estimatedTime: number;
  dueDate?: string;
  scheduledFor?: string;
  notes?: string;
}

export interface TeamMemberFormData {
  email: string;
  name: string;
  role: string;
  capacityHours: number;
}
