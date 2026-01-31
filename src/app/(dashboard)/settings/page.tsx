"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Building2 } from "lucide-react";
import { toast } from "sonner";

interface CompanyProfile {
  id: string;
  name: string;
  industry: string | null;
  narrative: string;
  toneDescription: string | null;
  toneSamples: string[];
  values: string[];
  voiceDos: string[];
  voiceDonts: string[];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    narrative: "",
    toneDescription: "",
    toneSamples: "",
    values: [] as string[],
    voiceDos: [] as string[],
    voiceDonts: [] as string[],
  });

  const [newValue, setNewValue] = useState("");
  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/company-profile");
      const data = await res.json();

      if (data) {
        setProfile(data);
        setFormData({
          name: data.name,
          industry: data.industry || "",
          narrative: data.narrative,
          toneDescription: data.toneDescription || "",
          toneSamples: data.toneSamples.join("\n"),
          values: data.values,
          voiceDos: data.voiceDos,
          voiceDonts: data.voiceDonts,
        });
      }
    } catch (error) {
      toast.error("Failed to load company profile");
    } finally {
      setLoading(false);
    }
  }

  function addItem(
    list: string[],
    setter: (fn: (prev: typeof formData) => typeof formData) => void,
    field: "values" | "voiceDos" | "voiceDonts",
    value: string,
    clearInput: () => void
  ) {
    if (value.trim() && !list.includes(value.trim())) {
      setter((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
      clearInput();
    }
  }

  function removeItem(
    field: "values" | "voiceDos" | "voiceDonts",
    index: number
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: formData.name,
      industry: formData.industry || undefined,
      narrative: formData.narrative,
      toneDescription: formData.toneDescription || undefined,
      toneSamples: formData.toneSamples.split("\n").filter((s) => s.trim()),
      values: formData.values,
      voiceDos: formData.voiceDos,
      voiceDonts: formData.voiceDonts,
    };

    try {
      const method = profile ? "PUT" : "POST";
      const res = await fetch("/api/company-profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      setProfile(data);
      toast.success("Company profile saved");
    } catch (error) {
      toast.error("Failed to save company profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Settings" description="Manage your company profile and preferences" />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Settings" description="Manage your company profile and preferences" />

      <div className="p-6 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Company Profile</CardTitle>
              </div>
              <CardDescription>
                This information is used to keep all AI-generated content on-brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
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
                    placeholder="e.g., Health & Wellness, SaaS, E-commerce"
                  />
                </div>
              </div>

              {/* Narrative */}
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
                  placeholder="Tell your brand story. What's your mission? What makes you unique? What do you stand for?"
                />
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label htmlFor="toneDescription">Tone & Voice Description</Label>
                <Textarea
                  id="toneDescription"
                  value={formData.toneDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, toneDescription: e.target.value })
                  }
                  rows={2}
                  placeholder="e.g., Friendly but professional, witty, empathetic, bold and confident"
                />
              </div>

              {/* Sample Copy */}
              <div className="space-y-2">
                <Label htmlFor="toneSamples">Sample Copy (one per line)</Label>
                <Textarea
                  id="toneSamples"
                  value={formData.toneSamples}
                  onChange={(e) =>
                    setFormData({ ...formData, toneSamples: e.target.value })
                  }
                  rows={4}
                  placeholder="Paste examples of copy that represents your brand voice well..."
                />
                <p className="text-xs text-muted-foreground">
                  Include taglines, ad copy, or messaging that exemplifies your brand voice
                </p>
              </div>

              {/* Values */}
              <div className="space-y-2">
                <Label>Brand Values</Label>
                <div className="flex gap-2">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Add a value..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem(formData.values, setFormData, "values", newValue, () =>
                          setNewValue("")
                        );
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addItem(formData.values, setFormData, "values", newValue, () =>
                        setNewValue("")
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.values.map((value, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {value}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeItem("values", i)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Voice Guidelines */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Voice Do&apos;s</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newDo}
                      onChange={(e) => setNewDo(e.target.value)}
                      placeholder="Add a do..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem(formData.voiceDos, setFormData, "voiceDos", newDo, () =>
                            setNewDo("")
                          );
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addItem(formData.voiceDos, setFormData, "voiceDos", newDo, () =>
                          setNewDo("")
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.voiceDos.map((item, i) => (
                      <Badge key={i} variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                        {item}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem("voiceDos", i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Voice Don&apos;ts</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newDont}
                      onChange={(e) => setNewDont(e.target.value)}
                      placeholder="Add a don't..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem(formData.voiceDonts, setFormData, "voiceDonts", newDont, () =>
                            setNewDont("")
                          );
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addItem(formData.voiceDonts, setFormData, "voiceDonts", newDont, () =>
                          setNewDont("")
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.voiceDonts.map((item, i) => (
                      <Badge key={i} variant="outline" className="gap-1 bg-red-50 text-red-700 border-red-200">
                        {item}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem("voiceDonts", i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
