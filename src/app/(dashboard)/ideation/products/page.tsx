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
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

// Type for API response (with parsed JSON fields)
type ProductResponse = {
  id: string;
  name: string;
  description: string;
  features: string[];
  usps: string[];
  pricePoint: string | null;
  offers: string | null;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    features: "",
    usps: "",
    pricePoint: "",
    offers: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      features: "",
      usps: "",
      pricePoint: "",
      offers: "",
    });
    setEditingProduct(null);
  }

  function openEditDialog(product: ProductResponse) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      features: product.features.join("\n"),
      usps: product.usps.join("\n"),
      pricePoint: product.pricePoint || "",
      offers: product.offers || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save product");

      toast.success(
        editingProduct ? "Product updated" : "Product created"
      );
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error("Failed to save product");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");

      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  }

  return (
    <>
      <Header
        title="Products"
        description="Manage products for ad concept generation"
      />

      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product Catalog</CardTitle>
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
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                      placeholder="Describe your product..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="features">
                      Key Features (one per line)
                    </Label>
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

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingProduct ? "Update" : "Create"} Product
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
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No products yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first product to start generating concepts
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {product.description}
                      </TableCell>
                      <TableCell>{product.features.length} features</TableCell>
                      <TableCell>{product.pricePoint || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
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
