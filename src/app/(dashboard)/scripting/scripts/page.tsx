"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Plus, Clock, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { SendToProductionDialog } from "@/components/scripts/send-to-production-dialog";

interface Concept {
  id: string;
  title: string;
  platform: string;
  format: string;
  complexity: string;
  product: { name: string };
  icp: { name: string };
}

interface Script {
  id: string;
  version: number;
  duration: number;
  status: string;
  aspectRatios: string[];
  createdAt: string;
  content: {
    hook: { spokenText: string };
    cta: { spokenText: string };
  };
  concept: {
    id: string;
    title: string;
    platform: string;
    format: string;
    complexity: string;
    product: { name: string };
    icp: { name: string };
  };
  productionReq: {
    locationType: string;
    talentNeeded: string;
    propsRequired: string[];
  } | null;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string>("");
  const [duration, setDuration] = useState("30");
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [selectedScriptForProduction, setSelectedScriptForProduction] = useState<Script | null>(null);

  useEffect(() => {
    fetchScripts();
    fetchApprovedConcepts();
  }, []);

  async function fetchScripts() {
    try {
      const res = await fetch("/api/scripts");
      const data = await res.json();
      setScripts(data);
    } catch (error) {
      toast.error("Failed to fetch scripts");
    } finally {
      setLoading(false);
    }
  }

  async function fetchApprovedConcepts() {
    try {
      const res = await fetch("/api/concepts?status=APPROVED");
      const data = await res.json();
      setConcepts(data);
    } catch (error) {
      console.error("Failed to fetch concepts:", error);
    }
  }

  async function generateScript() {
    if (!selectedConcept) {
      toast.error("Please select a concept");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: selectedConcept,
          duration: parseInt(duration),
          aspectRatios: ["9:16", "1:1"],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate script");
      }

      toast.success("Script generated successfully!");
      setDialogOpen(false);
      setSelectedConcept("");
      fetchScripts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate script");
    } finally {
      setGenerating(false);
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800",
    IN_REVIEW: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    IN_PRODUCTION: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-gray-100 text-gray-800",
  };

  function handleSendToProduction(script: Script) {
    setSelectedScriptForProduction(script);
    setProductionDialogOpen(true);
  }

  return (
    <>
      <Header
        title="Scripts"
        description="View and manage generated ad scripts"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            {scripts.length} script{scripts.length !== 1 ? "s" : ""} generated
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={concepts.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Generate Script
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Script</DialogTitle>
                <DialogDescription>
                  Select an approved concept to generate a video ad script.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Concept</label>
                  <Select value={selectedConcept} onValueChange={setSelectedConcept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a concept" />
                    </SelectTrigger>
                    <SelectContent>
                      {concepts.map((concept) => (
                        <SelectItem key={concept.id} value={concept.id}>
                          {concept.title} ({concept.platform})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (seconds)</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={generateScript}
                  disabled={generating || !selectedConcept}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Script"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scripts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : scripts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No scripts generated yet</p>
                <p className="text-sm mt-2">
                  {concepts.length > 0
                    ? "Click 'Generate Script' to create your first script from an approved concept."
                    : "Approve concepts in the Ideation module first."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scripts.map((script) => (
              <Card key={script.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {script.concept.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {script.concept.product.name} | {script.concept.platform} | {script.duration}s | v{script.version}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[script.status] || "bg-gray-100"}`}>
                        {script.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(script.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                {expandedScript === script.id && (
                  <CardContent className="border-t pt-4">
                    {/* Action Buttons */}
                    {script.status === "APPROVED" && (
                      <div className="mb-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendToProduction(script);
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send to Production
                        </Button>
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Script Content */}
                      <div>
                        <h4 className="font-medium mb-3">Script Sections</h4>
                        <div className="space-y-3 text-sm">
                          {Object.entries(script.content).map(([key, section]) => {
                            const s = section as { spokenText?: string; startTime?: number; endTime?: number };
                            return (
                              <div key={key} className="border rounded p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  {s.startTime !== undefined && s.endTime !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      {s.startTime}s - {s.endTime}s
                                    </span>
                                  )}
                                </div>
                                {s.spokenText && (
                                  <p className="text-muted-foreground">{s.spokenText}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Production Requirements */}
                      {script.productionReq && (
                        <div>
                          <h4 className="font-medium mb-3">Production Requirements</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span>{script.productionReq.locationType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Talent:</span>
                              <span>{script.productionReq.talentNeeded}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Props:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {script.productionReq.propsRequired.map((prop, i) => (
                                  <span key={i} className="px-2 py-1 bg-muted rounded text-xs">
                                    {prop}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Aspect Ratios:</span>
                              <span>{script.aspectRatios.join(", ")}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send to Production Dialog */}
      {selectedScriptForProduction && (
        <SendToProductionDialog
          open={productionDialogOpen}
          onOpenChange={setProductionDialogOpen}
          scriptId={selectedScriptForProduction.id}
          scriptTitle={selectedScriptForProduction.concept.title}
          onSuccess={fetchScripts}
        />
      )}
    </>
  );
}
