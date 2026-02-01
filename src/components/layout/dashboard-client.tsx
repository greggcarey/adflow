"use client";

import { TourProvider, TutorialTour } from "@/components/tutorial";
import { Sidebar } from "./sidebar";

interface DashboardClientProps {
  children: React.ReactNode;
  shouldAutoStartTour: boolean;
}

export function DashboardClient({ children, shouldAutoStartTour }: DashboardClientProps) {
  return (
    <TourProvider shouldAutoStart={shouldAutoStartTour}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
      <TutorialTour />
    </TourProvider>
  );
}
