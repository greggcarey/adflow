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

export default function OnboardingCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    narrative: "",
    toneDescription: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      industry: formData.industry || undefined,
      narrative: formData.narrative,
      toneDescription: formData.toneDescription || undefined,
      toneSamples: [],
      values: [],
      voiceDos: [],
      voiceDonts: [],
    };

    try {
      const res = await fetch("/api/company-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create company profile");

      toast.success("Company profile created!");
      router.push("/onboarding/product");
    } catch (error) {
      toast.error("Failed to create company profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tell us about your brand
        </h1>
        <p className="mt-1 text-muted-foreground">
          This helps our AI keep all your content on-brand.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Profile</CardTitle>
          <CardDescription>
            You can add more details later in Settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Your Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="e.g., Health & Wellness"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="narrative">Brand Narrative *</Label>
              <Textarea
                id="narrative"
                value={formData.narrative}
                onChange={(e) =>
                  setFormData({ ...formData, narrative: e.target.value })
                }
                required
                rows={4}
                placeholder="Tell your brand story. What's your mission? What makes you unique?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toneDescription">Tone & Voice</Label>
              <Textarea
                id="toneDescription"
                value={formData.toneDescription}
                onChange={(e) =>
                  setFormData({ ...formData, toneDescription: e.target.value })
                }
                rows={2}
                placeholder="e.g., Friendly but professional, witty, empathetic"
              />
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
