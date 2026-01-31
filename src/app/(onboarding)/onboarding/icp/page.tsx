"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_OPTIONS = ["Meta", "TikTok", "YouTube", "LinkedIn", "Twitter"];

export default function OnboardingICPPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    ageRange: "",
    gender: "",
    location: "",
    income: "",
    interests: "",
    values: "",
    lifestyle: "",
    painPoints: "",
    aspirations: "",
    buyingTriggers: "",
    platforms: [] as string[],
  });

  function togglePlatform(platform: string) {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      demographics: {
        ageRange: formData.ageRange,
        gender: formData.gender,
        location: formData.location,
        income: formData.income,
      },
      psychographics: {
        interests: formData.interests.split("\n").filter((i) => i.trim()),
        values: formData.values.split("\n").filter((v) => v.trim()),
        lifestyle: formData.lifestyle,
      },
      painPoints: formData.painPoints.split("\n").filter((p) => p.trim()),
      aspirations: formData.aspirations.split("\n").filter((a) => a.trim()),
      buyingTriggers: formData.buyingTriggers.split("\n").filter((t) => t.trim()),
      platforms: formData.platforms,
    };

    try {
      const res = await fetch("/api/icps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create ICP");

      const icp = await res.json();

      // Store ICP ID for later use
      sessionStorage.setItem("onboarding_icp_id", icp.id);

      toast.success("Customer profile created!");
      router.push("/onboarding/generate");
    } catch (error) {
      toast.error("Failed to create customer profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Define your ideal customer
        </h1>
        <p className="mt-1 text-muted-foreground">
          Help us understand who you want to reach with your ads.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Profile</CardTitle>
          <CardDescription>
            Describe your target audience&apos;s demographics and behaviors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Busy Professionals"
              />
            </div>

            {/* Demographics */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Demographics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ageRange">Age Range</Label>
                  <Input
                    id="ageRange"
                    value={formData.ageRange}
                    onChange={(e) =>
                      setFormData({ ...formData, ageRange: e.target.value })
                    }
                    placeholder="e.g., 25-45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    placeholder="e.g., All, Female, Male"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g., Urban areas, US"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income">Income Level</Label>
                  <Input
                    id="income"
                    value={formData.income}
                    onChange={(e) =>
                      setFormData({ ...formData, income: e.target.value })
                    }
                    placeholder="e.g., $75,000-$150,000"
                  />
                </div>
              </div>
            </div>

            {/* Pain Points & Aspirations */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="painPoints">Pain Points (one per line) *</Label>
                <Textarea
                  id="painPoints"
                  value={formData.painPoints}
                  onChange={(e) =>
                    setFormData({ ...formData, painPoints: e.target.value })
                  }
                  required
                  rows={4}
                  placeholder="Difficulty falling asleep&#10;Waking up tired&#10;No time to relax"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aspirations">Aspirations (one per line)</Label>
                <Textarea
                  id="aspirations"
                  value={formData.aspirations}
                  onChange={(e) =>
                    setFormData({ ...formData, aspirations: e.target.value })
                  }
                  rows={4}
                  placeholder="Wake up feeling refreshed&#10;Have more energy&#10;Better work-life balance"
                />
              </div>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <Label>Target Platforms *</Label>
              <p className="text-sm text-muted-foreground">
                Where does your audience spend their time?
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORM_OPTIONS.map((platform) => (
                  <Badge
                    key={platform}
                    variant={
                      formData.platforms.includes(platform) ? "default" : "outline"
                    }
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => togglePlatform(platform)}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={loading || formData.platforms.length === 0}
              >
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
