export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Users, Sparkles, ClipboardList, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

async function getIdeationStats() {
  const [products, icps, concepts] = await Promise.all([
    db.product.count(),
    db.iCP.count(),
    db.concept.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const conceptsByStatus = concepts.reduce(
    (acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    },
    {} as Record<string, number>
  );

  return { products, icps, conceptsByStatus };
}

export default async function IdeationPage() {
  const stats = await getIdeationStats();
  const totalConcepts = Object.values(stats.conceptsByStatus).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <>
      <Header
        title="Ideation Hub"
        description="Generate and manage ad concepts with AI assistance"
      />

      <div className="p-6 space-y-6">
        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Manage your product catalog for ad generation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.products}</span>
              <Link href="/ideation/products">
                <Button variant="outline">
                  Manage Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Ideal Customer Profiles</CardTitle>
                  <CardDescription>
                    Define target audiences for personalized concepts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.icps}</span>
              <Link href="/ideation/icps">
                <Button variant="outline">
                  Manage ICPs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Generate Concepts CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Generate New Concepts</h3>
                <p className="text-muted-foreground">
                  Use AI to create ad concepts based on your products and target
                  audiences
                </p>
              </div>
            </div>
            <Link href="/ideation/generate">
              <Button size="lg" className="shrink-0">
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Concepts
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Concept Pipeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Concept Pipeline</CardTitle>
                <CardDescription>
                  Track concepts through the review process
                </CardDescription>
              </div>
              <Link href="/ideation/concepts">
                <Button variant="outline">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-50">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.conceptsByStatus.GENERATED || 0}
                </p>
                <p className="text-sm text-blue-600">Generated</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-50">
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.conceptsByStatus.IN_REVIEW || 0}
                </p>
                <p className="text-sm text-yellow-600">In Review</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50">
                <p className="text-3xl font-bold text-green-600">
                  {stats.conceptsByStatus.APPROVED || 0}
                </p>
                <p className="text-sm text-green-600">Approved</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <p className="text-3xl font-bold text-gray-600">
                  {stats.conceptsByStatus.ARCHIVED || 0}
                </p>
                <p className="text-sm text-gray-600">Archived</p>
              </div>
            </div>

            {totalConcepts === 0 && (
              <div className="text-center py-8 mt-4 border-t">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No concepts yet</p>
                <p className="text-sm text-muted-foreground">
                  Generate your first concepts to start building your pipeline
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
