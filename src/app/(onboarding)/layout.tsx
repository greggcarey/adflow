"use client";

import { usePathname } from "next/navigation";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, name: "Welcome", path: "/welcome" },
  { id: 2, name: "Company", path: "/onboarding/company" },
  { id: 3, name: "Product", path: "/onboarding/product" },
  { id: 4, name: "ICP", path: "/onboarding/icp" },
  { id: 5, name: "Generate", path: "/onboarding/generate" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getCurrentStep = () => {
    if (pathname === "/welcome") return 1;
    if (pathname === "/onboarding/company") return 2;
    if (pathname === "/onboarding/product") return 3;
    if (pathname === "/onboarding/icp") return 4;
    if (pathname === "/onboarding/generate") return 5;
    if (pathname === "/onboarding/complete") return 6;
    return 1;
  };

  const currentStep = getCurrentStep();
  const isComplete = pathname === "/onboarding/complete";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AdFlow</span>
          </div>
          {!isComplete && (
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>
          )}
        </div>
      </header>

      {/* Progress */}
      {!isComplete && (
        <div className="border-b bg-muted/30">
          <div className="mx-auto max-w-4xl px-6 py-4">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-between">
                {steps.map((step) => (
                  <li key={step.id} className="flex items-center">
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        step.id < currentStep && "text-primary",
                        step.id === currentStep && "text-primary font-medium",
                        step.id > currentStep && "text-muted-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm",
                          step.id < currentStep &&
                            "border-primary bg-primary text-primary-foreground",
                          step.id === currentStep &&
                            "border-primary text-primary",
                          step.id > currentStep &&
                            "border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {step.id < currentStep ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <span className="hidden sm:inline">{step.name}</span>
                    </div>
                    {step.id < steps.length && (
                      <div
                        className={cn(
                          "mx-2 h-0.5 w-8 sm:w-16 lg:w-24",
                          step.id < currentStep ? "bg-primary" : "bg-muted"
                        )}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-12">{children}</div>
      </main>
    </div>
  );
}
