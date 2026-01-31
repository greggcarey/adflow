import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, Users, Sparkles, ArrowRight } from "lucide-react";

export default async function WelcomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {firstName}!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Let&apos;s set up your first ad campaign in just a few steps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What we&apos;ll do together</CardTitle>
          <CardDescription>
            A quick walkthrough to get you creating ads in minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">1. Set up your brand</h3>
              <p className="text-sm text-muted-foreground">
                Tell us about your company and brand voice to keep content on-brand.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">2. Add your product</h3>
              <p className="text-sm text-muted-foreground">
                Tell us about what you&apos;re selling - features, benefits, and
                unique selling points.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">3. Define your audience</h3>
              <p className="text-sm text-muted-foreground">
                Create an Ideal Customer Profile (ICP) to target the right
                people.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">4. Generate concepts</h3>
              <p className="text-sm text-muted-foreground">
                Our AI will create ad concepts tailored to your product and
                audience.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/onboarding/company">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
