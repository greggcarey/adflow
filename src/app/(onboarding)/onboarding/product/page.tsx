"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    features: "",
    usps: "",
    pricePoint: "",
    offers: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      description: formData.description,
      features: formData.features.split("\n").filter((f) => f.trim()),
      usps: formData.usps.split("\n").filter((u) => u.trim()),
      pricePoint: formData.pricePoint || null,
      offers: formData.offers || null,
      imageUrls: [],
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create product");

      const product = await res.json();

      // Store product ID for later use
      sessionStorage.setItem("onboarding_product_id", product.id);

      toast.success("Product created!");
      router.push("/onboarding/icp");
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tell us about your product
        </h1>
        <p className="mt-1 text-muted-foreground">
          This information helps our AI create targeted ad concepts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            Share the key information about what you&apos;re selling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., SleepWell Pro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={3}
                placeholder="Describe your product in a few sentences..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Key Features (one per line)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
                rows={4}
                placeholder="Advanced sleep tracking&#10;Smart alarm&#10;7-day battery life"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usps">
                Unique Selling Points (one per line)
              </Label>
              <Textarea
                id="usps"
                value={formData.usps}
                onChange={(e) =>
                  setFormData({ ...formData, usps: e.target.value })
                }
                rows={3}
                placeholder="Most accurate sleep tracker&#10;AI-powered recommendations"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePoint">Price Point</Label>
                <Input
                  id="pricePoint"
                  value={formData.pricePoint}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePoint: e.target.value })
                  }
                  placeholder="$149"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offers">Current Offers</Label>
                <Input
                  id="offers"
                  value={formData.offers}
                  onChange={(e) =>
                    setFormData({ ...formData, offers: e.target.value })
                  }
                  placeholder="Free 30-day trial"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
