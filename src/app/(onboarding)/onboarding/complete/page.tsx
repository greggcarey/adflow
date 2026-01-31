"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles, Package, Users, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function completeOnboarding() {
      setCompleting(true);
      try {
        const res = await fetch("/api/users/complete-onboarding", {
          method: "POST",
        });

        if (!res.ok) {
          throw new Error("Failed to complete onboarding");
        }

        // Clear session storage
        sessionStorage.removeItem("onboarding_product_id");
        sessionStorage.removeItem("onboarding_icp_id");

        setCompleted(true);
      } catch (error) {
        toast.error("Failed to complete onboarding");
      } finally {
        setCompleting(false);
      }
    }

    completeOnboarding();
  }, []);

  return (
    <div className="space-y-8 text-center">
      <div className="relative">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div className="absolute inset-0 animate-ping mx-auto h-20 w-20 rounded-full bg-green-100 opacity-25" />
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          You&apos;re all set!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your AdFlow workspace is ready to go.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">What you&apos;ve created:</h3>
          <div className="grid gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Your first product profile</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Your target audience profile</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">5 AI-generated ad concepts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button asChild size="lg" disabled={completing}>
          <Link href="/">
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          or{" "}
          <Link href="/ideation/concepts" className="text-primary hover:underline">
            review your concepts
          </Link>
        </p>
      </div>
    </div>
  );
}
