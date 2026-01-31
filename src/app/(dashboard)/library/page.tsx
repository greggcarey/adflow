import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Layers, Palette, MessageSquare } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

async function getLibraryStats() {
  const [templatesCount, hookTypes, formats, platforms] = await Promise.all([
    db.adTemplate.count(),
    db.hookTemplate.count(),
    db.formatTemplate.count(),
    db.adTemplate.groupBy({
      by: ["platform"],
      _count: true,
    }),
  ]);

  return {
    templatesCount,
    hookTypesCount: hookTypes,
    formatsCount: formats,
    platformsCount: platforms.length,
  };
}

export default async function LibraryPage() {
  const stats = await getLibraryStats();

  return (
    <>
      <Header
        title="Library"
        description="Your collection of ad templates and creative references"
      />

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/library/templates">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ad Templates</CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.templatesCount}</div>
                <p className="text-xs text-muted-foreground">
                  Reference ads with AI-extracted insights
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hook Types</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hookTypesCount}</div>
              <p className="text-xs text-muted-foreground">
                Proven hook patterns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formats</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.formatsCount}</div>
              <p className="text-xs text-muted-foreground">
                Ad format templates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platforms</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.platformsCount}</div>
              <p className="text-xs text-muted-foreground">
                Platform-specific templates
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Build your library of winning ads and creative references
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Upload Reference Ads</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload images or videos of ads you like, or paste URLs. Our AI will analyze and extract key features.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Claude analyzes each ad to extract format, hook type, visual style, and key features that make it effective.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Use for Inspiration</h4>
                    <p className="text-sm text-muted-foreground">
                      Reference your templates when generating new concepts and scripts to maintain consistent creative quality.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
