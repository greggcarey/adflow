"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { ICP } from "@prisma/client";

const PLATFORM_OPTIONS = ["Meta", "TikTok", "YouTube", "LinkedIn", "Twitter"];

export default function ICPsPage() {
  const [icps, setICPs] = useState<ICP[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingICP, setEditingICP] = useState<ICP | null>(null);

  // Form state
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

  useEffect(() => {
    fetchICPs();
  }, []);

  async function fetchICPs() {
    try {
      const res = await fetch("/api/icps");
      const data = await res.json();
      setICPs(data);
    } catch (error) {
      toast.error("Failed to load ICPs");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
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
      platforms: [],
    });
    setEditingICP(null);
  }

  function openEditDialog(icp: ICP) {
    const demographics = icp.demographics as Record<string, string>;
    const psychographics = icp.psychographics as {
      interests: string[];
      values: string[];
      lifestyle: string;
    };

    setEditingICP(icp);
    setFormData({
      name: icp.name,
      ageRange: demographics.ageRange || "",
      gender: demographics.gender || "",
      location: demographics.location || "",
      income: demographics.income || "",
      interests: psychographics.interests?.join("\n") || "",
      values: psychographics.values?.join("\n") || "",
      lifestyle: psychographics.lifestyle || "",
      painPoints: icp.painPoints.join("\n"),
      aspirations: icp.aspirations.join("\n"),
      buyingTriggers: icp.buyingTriggers.join("\n"),
      platforms: icp.platforms,
    });
    setDialogOpen(true);
  }

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
      const url = editingICP ? `/api/icps/${editingICP.id}` : "/api/icps";
      const method = editingICP ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save ICP");

      toast.success(editingICP ? "ICP updated" : "ICP created");
      setDialogOpen(false);
      resetForm();
      fetchICPs();
    } catch (error) {
      toast.error("Failed to save ICP");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this ICP?")) return;

    try {
      const res = await fetch(`/api/icps/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete ICP");

      toast.success("ICP deleted");
      fetchICPs();
    } catch (error) {
      toast.error("Failed to delete ICP");
    }
  }

  return (
    <>
      <Header
        title="Ideal Customer Profiles"
        description="Define target audiences for personalized ad concepts"
      />

      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Profiles</CardTitle>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add ICP
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingICP ? "Edit ICP" : "Add New ICP"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                    <h4 className="font-medium">Demographics</h4>
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

                  {/* Psychographics */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Psychographics</h4>
                    <div className="space-y-2">
                      <Label htmlFor="interests">Interests (one per line)</Label>
                      <Textarea
                        id="interests"
                        value={formData.interests}
                        onChange={(e) =>
                          setFormData({ ...formData, interests: e.target.value })
                        }
                        rows={3}
                        placeholder="Health & wellness&#10;Technology&#10;Self-improvement"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="values">Values (one per line)</Label>
                      <Textarea
                        id="values"
                        value={formData.values}
                        onChange={(e) =>
                          setFormData({ ...formData, values: e.target.value })
                        }
                        rows={2}
                        placeholder="Efficiency&#10;Health&#10;Work-life balance"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lifestyle">Lifestyle Description</Label>
                      <Input
                        id="lifestyle"
                        value={formData.lifestyle}
                        onChange={(e) =>
                          setFormData({ ...formData, lifestyle: e.target.value })
                        }
                        placeholder="e.g., Fast-paced, career-focused"
                      />
                    </div>
                  </div>

                  {/* Pain Points & Aspirations */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="painPoints">Pain Points (one per line)</Label>
                      <Textarea
                        id="painPoints"
                        value={formData.painPoints}
                        onChange={(e) =>
                          setFormData({ ...formData, painPoints: e.target.value })
                        }
                        rows={4}
                        placeholder="Difficulty falling asleep&#10;Waking up tired"
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
                        placeholder="Wake up feeling refreshed&#10;Have more energy"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyingTriggers">
                      Buying Triggers (one per line)
                    </Label>
                    <Textarea
                      id="buyingTriggers"
                      value={formData.buyingTriggers}
                      onChange={(e) =>
                        setFormData({ ...formData, buyingTriggers: e.target.value })
                      }
                      rows={3}
                      placeholder="Health scare&#10;New Year's resolutions&#10;Friend's recommendation"
                    />
                  </div>

                  {/* Platforms */}
                  <div className="space-y-2">
                    <Label>Preferred Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORM_OPTIONS.map((platform) => (
                        <Badge
                          key={platform}
                          variant={
                            formData.platforms.includes(platform)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => togglePlatform(platform)}
                        >
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingICP ? "Update" : "Create"} ICP
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : icps.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No ICPs yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Define your first ideal customer profile
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add ICP
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Demographics</TableHead>
                    <TableHead>Pain Points</TableHead>
                    <TableHead>Platforms</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {icps.map((icp) => {
                    const demographics = icp.demographics as Record<
                      string,
                      string
                    >;
                    return (
                      <TableRow key={icp.id}>
                        <TableCell className="font-medium">{icp.name}</TableCell>
                        <TableCell>
                          {demographics.ageRange}, {demographics.gender}
                        </TableCell>
                        <TableCell>{icp.painPoints.length} pain points</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {icp.platforms.slice(0, 2).map((p) => (
                              <Badge key={p} variant="secondary" className="text-xs">
                                {p}
                              </Badge>
                            ))}
                            {icp.platforms.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{icp.platforms.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(icp)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(icp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
