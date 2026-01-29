export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, FileText, CheckCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

async function getStats() {
  const [totalConcepts, approvedConcepts, inReviewConcepts, totalProducts] =
    await Promise.all([
      db.concept.count(),
      db.concept.count({ where: { status: "APPROVED" } }),
      db.concept.count({ where: { status: "IN_REVIEW" } }),
      db.product.count(),
    ]);

  return { totalConcepts, approvedConcepts, inReviewConcepts, totalProducts };
}

async function getRecentConcepts() {
  return db.concept.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      icp: { select: { name: true } },
    },
  });
}

export default async function DashboardPage() {
  const stats = await getStats();
  const recentConcepts = await getRecentConcepts();

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your ad production pipeline"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Concepts
              </CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConcepts}</div>
              <p className="text-xs text-muted-foreground">
                All generated concepts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inReviewConcepts}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedConcepts}</div>
              <p className="text-xs text-muted-foreground">
                Ready for scripting
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Active products
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/ideation/generate">
              <Button>
                <Lightbulb className="mr-2 h-4 w-4" />
                Generate Concepts
              </Button>
            </Link>
            <Link href="/ideation/products">
              <Button variant="outline">Add Product</Button>
            </Link>
            <Link href="/ideation/icps">
              <Button variant="outline">Add ICP</Button>
            </Link>
            <Link href="/ideation/concepts">
              <Button variant="outline">Review Concepts</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Concepts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Concepts</CardTitle>
            <Link href="/ideation/concepts">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentConcepts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No concepts generated yet</p>
                <p className="text-sm">
                  Start by adding a product and ICP, then generate your first
                  concepts.
                </p>
                <Link href="/ideation/generate">
                  <Button className="mt-4">Generate Your First Concepts</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentConcepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h4 className="font-medium">{concept.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {concept.product.name} • {concept.icp.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          concept.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : concept.status === "IN_REVIEW"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {concept.status.replace("_", " ")}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          concept.complexity === "LOW"
                            ? "bg-green-100 text-green-800"
                            : concept.complexity === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {concept.complexity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
