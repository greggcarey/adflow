"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { TUTORIAL_STORAGE_KEY } from "@/lib/tutorial";

interface TourContextValue {
  isRunning: boolean;
  stepIndex: number;
  hasCompleted: boolean;
  startTour: () => void;
  endTour: () => void;
  skipTour: () => void;
  setStepIndex: (index: number) => void;
  completeTour: () => Promise<void>;
}

const TourContext = createContext<TourContextValue | null>(null);

interface TourProviderProps {
  children: ReactNode;
  shouldAutoStart?: boolean;
}

export function TourProvider({ children, shouldAutoStart = false }: TourProviderProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true); // Default true to prevent flash

  // Check localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    setHasCompleted(completed);

    // Auto-start tour for new users
    if (shouldAutoStart && !completed) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsRunning(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoStart]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  const endTour = useCallback(() => {
    setIsRunning(false);
    setStepIndex(0);
  }, []);

  const skipTour = useCallback(async () => {
    setIsRunning(false);
    setStepIndex(0);
    setHasCompleted(true);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");

    // Mark complete in database
    try {
      await fetch("/api/user/complete-tutorial", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to mark tutorial complete:", error);
    }
  }, []);

  const completeTour = useCallback(async () => {
    setIsRunning(false);
    setHasCompleted(true);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");

    // Mark complete in database
    try {
      await fetch("/api/user/complete-tutorial", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to mark tutorial complete:", error);
    }
  }, []);

  return (
    <TourContext.Provider
      value={{
        isRunning,
        stepIndex,
        hasCompleted,
        startTour,
        endTour,
        skipTour,
        setStepIndex,
        completeTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
