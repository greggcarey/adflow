import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/layout/dashboard-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if we should auto-start the tutorial for new users
  const shouldAutoStartTour = session?.user && !session.user.onboardingComplete;

  return (
    <DashboardClient shouldAutoStartTour={!!shouldAutoStartTour}>
      {children}
    </DashboardClient>
  );
}
