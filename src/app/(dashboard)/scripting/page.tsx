export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

async function getStats() {
  const [totalScripts, draftScripts, approvedScripts, approvedConcepts] =
    await Promise.all([
      db.script.count(),
      db.script.count({ where: { status: "DRAFT" } }),
      db.script.count({ where: { status: "APPROVED" } }),
      db.concept.count({ where: { status: "APPROVED" } }),
    ]);

  return { totalScripts, draftScripts, approvedScripts, approvedConcepts };
}

async function getApprovedConcepts() {
  const concepts = await db.concept.findMany({
    where: { status: "APPROVED" },
    orderBy: { approvedAt: "desc" },
    take: 10,
    include: {
      product: { select: { name: true } },
      icp: { select: { name: true } },
      scripts: { select: { id: true } },
    },
  });
  return concepts;
}

export default async function ScriptingPage() {
  const stats = await getStats();
  const approvedConcepts = await getApprovedConcepts();

  return (
    <>
      <Header
        title="Scripting"
        description="Generate and manage ad scripts from approved concepts"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Scripts
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScripts}</div>
              <p className="text-xs text-muted-foreground">
                All generated scripts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftScripts}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedScripts}</div>
              <p className="text-xs text-muted-foreground">
                Ready for production
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ready Concepts
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedConcepts}</div>
              <p className="text-xs text-muted-foreground">
                Approved concepts awaiting scripts
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
            <Link href="/scripting/scripts">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                View All Scripts
              </Button>
            </Link>
            <Link href="/ideation/concepts">
              <Button variant="outline">Review Concepts</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Approved Concepts Ready for Scripting */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Approved Concepts - Ready for Scripts</CardTitle>
            <Link href="/ideation/concepts?status=APPROVED">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {approvedConcepts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No approved concepts yet</p>
                <p className="text-sm">
                  Approve concepts in the Ideation module to generate scripts.
                </p>
                <Link href="/ideation/concepts">
                  <Button className="mt-4">Review Concepts</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedConcepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h4 className="font-medium">{concept.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {concept.product.name} | {concept.icp.name} | {concept.platform}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {concept.scripts.length > 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {concept.scripts.length} script(s)
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          No scripts
                        </span>
                      )}
                      <Link href={`/scripting/scripts?conceptId=${concept.id}`}>
                        <Button size="sm">
                          {concept.scripts.length > 0 ? "View Scripts" : "Generate Script"}
                        </Button>
                      </Link>
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
