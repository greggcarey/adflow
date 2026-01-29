"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Package, Users, ArrowRight, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AD_FORMATS, HOOK_TYPES, ANGLES, PLATFORMS } from "@/lib/constants";
import type { Product, ICP, Concept } from "@prisma/client";

type Step = "product" | "icp" | "preferences" | "generate" | "results";

type ConceptWithRelations = Concept & {
  product: { name: string };
  icp: { name: string };
};

export default function GenerateConceptsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("product");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [icps, setICPs] = useState<ICP[]>([]);
  const [generatedConcepts, setGeneratedConcepts] = useState<ConceptWithRelations[]>([]);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedICP, setSelectedICP] = useState<string>("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedHooks, setSelectedHooks] = useState<string[]>([]);
  const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
  const [trends, setTrends] = useState("");
  const [conceptCount, setConceptCount] = useState(5);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [productsRes, icpsRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/icps"),
        ]);
        setProducts(await productsRes.json());
        setICPs(await icpsRes.json());
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function toggleSelection(
    value: string,
    selected: string[],
    setter: (v: string[]) => void
  ) {
    setter(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          icpId: selectedICP,
          formatPreferences: selectedFormats,
          hookTypes: selectedHooks,
          anglePreferences: selectedAngles,
          trends: trends || undefined,
          count: conceptCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate concepts");
      }

      setGeneratedConcepts(data.concepts);
      setStep("results");
      toast.success(`Generated ${data.count} concepts!`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate concepts"
      );
    } finally {
      setGenerating(false);
    }
  }

  function getStepNumber(): number {
    const steps: Step[] = ["product", "icp", "preferences", "generate", "results"];
    return steps.indexOf(step) + 1;
  }

  function canProceed(): boolean {
    switch (step) {
      case "product":
        return !!selectedProduct;
      case "icp":
        return !!selectedICP;
      case "preferences":
        return true; // All optional
      case "generate":
        return true;
      default:
        return false;
    }
  }

  function nextStep() {
    const steps: Step[] = ["product", "icp", "preferences", "generate"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  }

  function prevStep() {
    const steps: Step[] = ["product", "icp", "preferences", "generate"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Generate Concepts" />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Generate Concepts"
        description="Create AI-powered ad concepts based on your products and audiences"
      />

      <div className="p-6">
        {/* Progress */}
        {step !== "results" && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {getStepNumber()} of 4</span>
              <span>
                {step === "product" && "Select Product"}
                {step === "icp" && "Select Audience"}
                {step === "preferences" && "Set Preferences"}
                {step === "generate" && "Review & Generate"}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(getStepNumber() / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Select Product */}
        {step === "product" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select a Product
              </CardTitle>
              <CardDescription>
                Choose the product you want to create ad concepts for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No products found</p>
                  <Button onClick={() => router.push("/ideation/products")}>
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProduct === product.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.features.slice(0, 3).map((feature, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {selectedProduct === product.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <Button onClick={nextStep} disabled={!canProceed()}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select ICP */}
        {step === "icp" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Target Audience
              </CardTitle>
              <CardDescription>
                Choose the ideal customer profile to target
              </CardDescription>
            </CardHeader>
            <CardContent>
              {icps.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No ICPs found</p>
                  <Button onClick={() => router.push("/ideation/icps")}>
                    Add Your First ICP
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {icps.map((icp) => {
                    const demographics = icp.demographics as Record<string, string>;
                    return (
                      <div
                        key={icp.id}
                        onClick={() => setSelectedICP(icp.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedICP === icp.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{icp.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {demographics.ageRange}, {demographics.gender} •{" "}
                              {demographics.location}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {icp.platforms.map((platform, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {selectedICP === icp.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} disabled={!canProceed()}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preferences */}
        {step === "preferences" && (
          <Card>
            <CardHeader>
              <CardTitle>Generation Preferences</CardTitle>
              <CardDescription>
                Customize what types of concepts to generate (all optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formats */}
              <div className="space-y-3">
                <Label>Ad Formats to Explore</Label>
                <div className="flex flex-wrap gap-2">
                  {AD_FORMATS.map((format) => (
                    <Badge
                      key={format.value}
                      variant={
                        selectedFormats.includes(format.value) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        toggleSelection(format.value, selectedFormats, setSelectedFormats)
                      }
                    >
                      {format.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Hook Types */}
              <div className="space-y-3">
                <Label>Hook Types to Use</Label>
                <div className="flex flex-wrap gap-2">
                  {HOOK_TYPES.map((hook) => (
                    <Badge
                      key={hook.value}
                      variant={
                        selectedHooks.includes(hook.value) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        toggleSelection(hook.value, selectedHooks, setSelectedHooks)
                      }
                    >
                      {hook.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Angles */}
              <div className="space-y-3">
                <Label>Angles to Consider</Label>
                <div className="flex flex-wrap gap-2">
                  {ANGLES.map((angle) => (
                    <Badge
                      key={angle.value}
                      variant={
                        selectedAngles.includes(angle.value) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        toggleSelection(angle.value, selectedAngles, setSelectedAngles)
                      }
                    >
                      {angle.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Trends */}
              <div className="space-y-2">
                <Label htmlFor="trends">Current Trends or Context (optional)</Label>
                <Textarea
                  id="trends"
                  value={trends}
                  onChange={(e) => setTrends(e.target.value)}
                  placeholder="e.g., New Year's resolutions, sleep awareness month, competitor launched similar product..."
                  rows={3}
                />
              </div>

              {/* Count */}
              <div className="space-y-2">
                <Label>Number of Concepts to Generate</Label>
                <Select
                  value={conceptCount.toString()}
                  onValueChange={(v) => setConceptCount(parseInt(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} concepts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep}>
                  Review & Generate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Generate */}
        {step === "generate" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Review & Generate
              </CardTitle>
              <CardDescription>
                Review your selections and generate concepts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Product
                  </h4>
                  <p className="font-medium">
                    {products.find((p) => p.id === selectedProduct)?.name}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Target Audience
                  </h4>
                  <p className="font-medium">
                    {icps.find((i) => i.id === selectedICP)?.name}
                  </p>
                </div>
              </div>

              {(selectedFormats.length > 0 ||
                selectedHooks.length > 0 ||
                selectedAngles.length > 0) && (
                <div className="space-y-3">
                  {selectedFormats.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Formats
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedFormats.map((f) => (
                          <Badge key={f} variant="secondary">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedHooks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Hook Types
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedHooks.map((h) => (
                          <Badge key={h} variant="secondary">
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedAngles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Angles
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedAngles.map((a) => (
                          <Badge key={a} variant="secondary">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {trends && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Trends/Context
                  </h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">{trends}</p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm">
                  Ready to generate{" "}
                  <span className="font-semibold">{conceptCount} concepts</span> using
                  AI based on your selections.
                </p>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Concepts
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {step === "results" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Generated {generatedConcepts.length} Concepts
                </CardTitle>
                <CardDescription>
                  Review your AI-generated concepts below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button onClick={() => router.push("/ideation/concepts")}>
                    Review All Concepts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("product");
                      setGeneratedConcepts([]);
                    }}
                  >
                    Generate More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Concept Cards */}
            <div className="grid gap-4">
              {generatedConcepts.map((concept) => (
                <Card key={concept.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{concept.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {concept.product.name} • {concept.icp.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
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

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Hook ({concept.hookType})
                        </h4>
                        <p className="text-sm">{concept.hookText}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Core Message
                        </h4>
                        <p className="text-sm">{concept.coreMessage}</p>
                      </div>
                    </div>

                    {concept.rationale && (
                      <div className="mt-4 p-3 rounded-lg bg-muted">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Why It Works
                        </h4>
                        <p className="text-sm">{concept.rationale}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Badge variant="secondary">{concept.platform}</Badge>
                      <Badge variant="secondary">{concept.angle}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
