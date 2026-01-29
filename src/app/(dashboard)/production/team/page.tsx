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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { TeamMemberWithStats } from "@/types";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberWithStats | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    capacityHours: 8,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch("/api/team-members");
      const data = await res.json();
      setMembers(data);
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      email: "",
      role: "",
      capacityHours: 8,
    });
    setEditingMember(null);
  }

  function openEditDialog(member: TeamMemberWithStats) {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      capacityHours: member.capacityHours,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      capacityHours: Number(formData.capacityHours),
    };

    try {
      const url = editingMember
        ? `/api/team-members/${editingMember.id}`
        : "/api/team-members";
      const method = editingMember ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save team member");
      }

      toast.success(
        editingMember ? "Team member updated" : "Team member added"
      );
      setDialogOpen(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save team member"
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const res = await fetch(`/api/team-members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove team member");

      toast.success("Team member removed");
      fetchMembers();
    } catch {
      toast.error("Failed to remove team member");
    }
  }

  function getCapacityColor(assigned: number, capacity: number) {
    const ratio = assigned / capacity;
    if (ratio >= 1) return "text-red-600";
    if (ratio >= 0.75) return "text-yellow-600";
    return "text-green-600";
  }

  return (
    <>
      <Header
        title="Team"
        description="Manage team members for production tasks"
      />

      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Team Members</CardTitle>
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
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingMember ? "Edit Team Member" : "Add Team Member"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      placeholder="john@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      required
                      placeholder="Video Editor, Producer, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacityHours">
                      Daily Capacity (hours)
                    </Label>
                    <Input
                      id="capacityHours"
                      type="number"
                      min={1}
                      max={24}
                      value={formData.capacityHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacityHours: Number(e.target.value),
                        })
                      }
                      placeholder="8"
                    />
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
                      {editingMember ? "Update" : "Add"} Member
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
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No team members yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add team members to assign production tasks
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={getCapacityColor(
                            member.assignedHours || 0,
                            member.capacityHours
                          )}
                        >
                          {member.assignedHours || 0}h / {member.capacityHours}h
                        </span>
                      </TableCell>
                      <TableCell>{member._count.tasksAssigned} tasks</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
