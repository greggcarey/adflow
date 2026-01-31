"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Package, Users, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Product, ICP } from "@prisma/client";

export default function OnboardingGeneratePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [icp, setICP] = useState<ICP | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const productId = sessionStorage.getItem("onboarding_product_id");
        const icpId = sessionStorage.getItem("onboarding_icp_id");

        if (!productId || !icpId) {
          toast.error("Please complete the previous steps first");
          router.push("/onboarding/product");
          return;
        }

        const [productRes, icpRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch(`/api/icps/${icpId}`),
        ]);

        if (!productRes.ok || !icpRes.ok) {
          throw new Error("Failed to load data");
        }

        setProduct(await productRes.json());
        setICP(await icpRes.json());
      } catch (error) {
        toast.error("Failed to load data");
        router.push("/onboarding/product");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  async function handleGenerate() {
    if (!product || !icp) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          icpId: icp.id,
          count: 5,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate concepts");
      }

      toast.success(`Generated ${data.count} concepts!`);
      router.push("/onboarding/complete");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate concepts"
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const demographics = icp?.demographics as Record<string, string> | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Ready to generate concepts
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review your setup and let AI create your first ad concepts.
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Product</CardTitle>
                <CardDescription className="text-sm">
                  What you&apos;re selling
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium">{product?.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {product?.description}
            </p>
            {product?.features && product.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {product.features.slice(0, 3).map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {product.features.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{product.features.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Target Audience</CardTitle>
                <CardDescription className="text-sm">
                  Who you&apos;re reaching
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium">{icp?.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {demographics?.ageRange && `${demographics.ageRange}`}
              {demographics?.gender && `, ${demographics.gender}`}
              {demographics?.location && ` • ${demographics.location}`}
            </p>
            {icp?.platforms && icp.platforms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {icp.platforms.map((platform, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {platform}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">AI Generation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Our AI will analyze your product and audience to create 5
                personalized ad concepts with hooks, messaging angles, and
                format recommendations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Concepts...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My First Concepts
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
