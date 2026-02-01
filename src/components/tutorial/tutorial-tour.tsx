"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import type { CallBackProps } from "react-joyride";
import { STATUS } from "react-joyride";
import { tutorialSteps } from "@/lib/tutorial";
import { useTour } from "./tour-provider";

// Dynamic import to avoid SSR issues with react-joyride
const Joyride = dynamic(() => import("react-joyride"), {
  ssr: false,
});

export function TutorialTour() {
  const { isRunning, stepIndex, setStepIndex, completeTour, skipTour } = useTour();

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, index, action, type } = data;
      const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

      if (finishedStatuses.includes(status as string)) {
        if (status === STATUS.SKIPPED) {
          skipTour();
        } else {
          completeTour();
        }
        return;
      }

      if (type === "step:after") {
        if (action === "next") {
          setStepIndex(index + 1);
        } else if (action === "prev") {
          setStepIndex(index - 1);
        }
      }
    },
    [setStepIndex, completeTour, skipTour]
  );

  if (!isRunning) {
    return null;
  }

  return (
    <Joyride
      steps={tutorialSteps}
      run={isRunning}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#18181b", // zinc-900
          textColor: "#09090b", // zinc-950
          backgroundColor: "#ffffff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
          arrowColor: "#ffffff",
        },
        tooltip: {
          borderRadius: "0.5rem",
          padding: "1rem",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
        },
        tooltipContent: {
          fontSize: "0.875rem",
          lineHeight: 1.5,
          color: "#71717a", // zinc-500
        },
        buttonNext: {
          backgroundColor: "#18181b", // zinc-900
          color: "#ffffff",
          borderRadius: "0.375rem",
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 500,
        },
        buttonBack: {
          color: "#71717a", // zinc-500
          marginRight: "0.5rem",
          fontSize: "0.875rem",
        },
        buttonSkip: {
          color: "#71717a", // zinc-500
          fontSize: "0.875rem",
        },
        spotlight: {
          borderRadius: "0.5rem",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Get Started",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}
