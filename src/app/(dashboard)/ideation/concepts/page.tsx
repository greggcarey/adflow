"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Lightbulb,
  MoreVertical,
  CheckCircle,
  XCircle,
  Archive,
  Edit,
  Trash2,
  Filter,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Concept, Product, ICP } from "@prisma/client";

type ConceptWithRelations = Concept & {
  product: { id: string; name: string };
  icp: { id: string; name: string };
};

type ConceptStatus =
  | "GENERATED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "ARCHIVED"
  | "REJECTED";

const STATUS_CONFIG: Record<
  ConceptStatus,
  { label: string; color: string; bgColor: string }
> = {
  GENERATED: {
    label: "Generated",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  IN_REVIEW: {
    label: "In Review",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  APPROVED: {
    label: "Approved",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  REVISION_REQUESTED: {
    label: "Revision Needed",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
};

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<ConceptWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] =
    useState<ConceptWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [complexityFilter, setComplexityFilter] = useState<string>("all");

  // Notes for revision
  const [revisionNotes, setRevisionNotes] = useState("");

  useEffect(() => {
    fetchConcepts();
  }, [statusFilter, formatFilter, complexityFilter]);

  async function fetchConcepts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (formatFilter !== "all") params.set("format", formatFilter);
      if (complexityFilter !== "all") params.set("complexity", complexityFilter);

      const res = await fetch(`/api/concepts?${params.toString()}`);
      const data = await res.json();
      setConcepts(data);
    } catch (error) {
      toast.error("Failed to load concepts");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: ConceptStatus, notes?: string) {
    try {
      const body: { status: ConceptStatus; notes?: string } = { status };
      if (notes) body.notes = notes;

      const res = await fetch(`/api/concepts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
      fetchConcepts();

      if (selectedConcept?.id === id) {
        const updated = await res.json();
        setSelectedConcept(updated);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  }

  async function deleteConcept(id: string) {
    if (!confirm("Are you sure you want to delete this concept?")) return;

    try {
      const res = await fetch(`/api/concepts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete concept");

      toast.success("Concept deleted");
      setDetailOpen(false);
      setSelectedConcept(null);
      fetchConcepts();
    } catch (error) {
      toast.error("Failed to delete concept");
    }
  }

  function openDetail(concept: ConceptWithRelations) {
    setSelectedConcept(concept);
    setRevisionNotes(concept.notes || "");
    setDetailOpen(true);
  }

  // Get unique formats from concepts
  const formats = [...new Set(concepts.map((c) => c.format))];

  // Group concepts by status for kanban view
  const conceptsByStatus = {
    GENERATED: concepts.filter((c) => c.status === "GENERATED"),
    IN_REVIEW: concepts.filter((c) => c.status === "IN_REVIEW"),
    APPROVED: concepts.filter((c) => c.status === "APPROVED"),
    ARCHIVED: concepts.filter(
      (c) => c.status === "ARCHIVED" || c.status === "REJECTED"
    ),
  };

  return (
    <>
      <Header
        title="Concept Review"
        description="Review, approve, and manage your ad concepts"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {formats.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={complexityFilter} onValueChange={setComplexityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Complexity</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <Link href="/ideation/generate">
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate More
              </Button>
            </Link>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban" className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : concepts.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No concepts found</p>
                <Link href="/ideation/generate">
                  <Button>Generate Your First Concepts</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Generated Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <h3 className="font-medium">Generated</h3>
                    <Badge variant="secondary">
                      {conceptsByStatus.GENERATED.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {conceptsByStatus.GENERATED.map((concept) => (
                      <ConceptCard
                        key={concept.id}
                        concept={concept}
                        onOpenDetail={openDetail}
                        onUpdateStatus={updateStatus}
                        onDelete={deleteConcept}
                      />
                    ))}
                  </div>
                </div>

                {/* In Review Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <h3 className="font-medium">In Review</h3>
                    <Badge variant="secondary">
                      {conceptsByStatus.IN_REVIEW.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {conceptsByStatus.IN_REVIEW.map((concept) => (
                      <ConceptCard
                        key={concept.id}
                        concept={concept}
                        onOpenDetail={openDetail}
                        onUpdateStatus={updateStatus}
                        onDelete={deleteConcept}
                      />
                    ))}
                  </div>
                </div>

                {/* Approved Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <h3 className="font-medium">Approved</h3>
                    <Badge variant="secondary">
                      {conceptsByStatus.APPROVED.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {conceptsByStatus.APPROVED.map((concept) => (
                      <ConceptCard
                        key={concept.id}
                        concept={concept}
                        onOpenDetail={openDetail}
                        onUpdateStatus={updateStatus}
                        onDelete={deleteConcept}
                      />
                    ))}
                  </div>
                </div>

                {/* Archived Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                    <h3 className="font-medium">Archived/Rejected</h3>
                    <Badge variant="secondary">
                      {conceptsByStatus.ARCHIVED.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {conceptsByStatus.ARCHIVED.map((concept) => (
                      <ConceptCard
                        key={concept.id}
                        concept={concept}
                        onOpenDetail={openDetail}
                        onUpdateStatus={updateStatus}
                        onDelete={deleteConcept}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : concepts.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No concepts found</p>
                <Link href="/ideation/generate">
                  <Button>Generate Your First Concepts</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {concepts.map((concept) => (
                  <Card
                    key={concept.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetail(concept)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{concept.title}</h4>
                            <Badge
                              className={`${
                                STATUS_CONFIG[concept.status as ConceptStatus].bgColor
                              } ${
                                STATUS_CONFIG[concept.status as ConceptStatus].color
                              }`}
                            >
                              {STATUS_CONFIG[concept.status as ConceptStatus].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {concept.product.name} • {concept.icp.name}
                          </p>
                          <p className="text-sm line-clamp-2">
                            {concept.coreMessage}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline">{concept.format}</Badge>
                          <Badge
                            variant={
                              concept.complexity === "LOW"
                                ? "secondary"
                                : concept.complexity === "MEDIUM"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {concept.complexity}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedConcept && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedConcept.title}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status & Actions */}
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      STATUS_CONFIG[selectedConcept.status as ConceptStatus].bgColor
                    } ${
                      STATUS_CONFIG[selectedConcept.status as ConceptStatus].color
                    }`}
                  >
                    {STATUS_CONFIG[selectedConcept.status as ConceptStatus].label}
                  </Badge>
                  <Badge variant="outline">{selectedConcept.format}</Badge>
                  <Badge variant="outline">{selectedConcept.platform}</Badge>
                  <Badge
                    variant={
                      selectedConcept.complexity === "LOW"
                        ? "secondary"
                        : selectedConcept.complexity === "MEDIUM"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {selectedConcept.complexity}
                  </Badge>
                </div>

                {/* Product & ICP */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Product</p>
                    <p className="font-medium">{selectedConcept.product.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Target Audience</p>
                    <p className="font-medium">{selectedConcept.icp.name}</p>
                  </div>
                </div>

                {/* Hook */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Hook ({selectedConcept.hookType})
                  </h4>
                  <p className="p-3 rounded-lg bg-muted">
                    {selectedConcept.hookText || "No hook text"}
                  </p>
                </div>

                {/* Core Message */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Core Message
                  </h4>
                  <p className="p-3 rounded-lg bg-muted">
                    {selectedConcept.coreMessage}
                  </p>
                </div>

                {/* Angle */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Angle
                  </h4>
                  <p>{selectedConcept.angle}</p>
                </div>

                {/* Rationale */}
                {selectedConcept.rationale && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Why It Works
                    </h4>
                    <p className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                      {selectedConcept.rationale}
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Add notes or revision feedback..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button
                    onClick={() =>
                      updateStatus(
                        selectedConcept.id,
                        "APPROVED",
                        revisionNotes || undefined
                      )
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateStatus(selectedConcept.id, "IN_REVIEW")
                    }
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Mark In Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateStatus(
                        selectedConcept.id,
                        "REVISION_REQUESTED",
                        revisionNotes
                      )
                    }
                  >
                    Request Revision
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateStatus(selectedConcept.id, "ARCHIVED")
                    }
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() =>
                      updateStatus(selectedConcept.id, "REJECTED")
                    }
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => deleteConcept(selectedConcept.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Concept
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// Concept Card Component
function ConceptCard({
  concept,
  onOpenDetail,
  onUpdateStatus,
  onDelete,
}: {
  concept: ConceptWithRelations;
  onOpenDetail: (c: ConceptWithRelations) => void;
  onUpdateStatus: (id: string, status: ConceptStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpenDetail(concept)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-2">{concept.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(concept.id, "APPROVED");
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(concept.id, "IN_REVIEW");
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Move to Review
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(concept.id, "ARCHIVED");
                }}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(concept.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          {concept.product.name}
        </p>

        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {concept.format}
          </Badge>
          <Badge
            variant={
              concept.complexity === "LOW"
                ? "secondary"
                : concept.complexity === "MEDIUM"
                ? "default"
                : "destructive"
            }
            className="text-xs"
          >
            {concept.complexity}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
