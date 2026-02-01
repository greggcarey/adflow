import type { Step } from "react-joyride";

export const tutorialSteps: Step[] = [
  // Step 1: Welcome
  {
    target: "body",
    placement: "center",
    title: "Welcome to AdFlow!",
    content:
      "Let's take a quick tour of your AI-powered ad production platform. This will only take a minute.",
    disableBeacon: true,
  },
  // Step 2: Dashboard overview
  {
    target: "[data-tour='dashboard']",
    placement: "bottom",
    title: "Your Dashboard",
    content:
      "This is your command center. Track concepts, review their status, and access quick actions all in one place.",
    disableBeacon: true,
  },
  // Step 3: Ideation
  {
    target: "[data-tour='nav-ideation']",
    placement: "right",
    title: "Ideation",
    content:
      "Generate ad concepts with AI. Add your products and customer profiles (ICPs), then let Claude create compelling ad ideas tailored to your audience.",
    disableBeacon: true,
  },
  // Step 4: Scripting
  {
    target: "[data-tour='nav-scripting']",
    placement: "right",
    title: "Scripting",
    content:
      "Turn approved concepts into video scripts. AI generates scene-by-scene breakdowns ready for your production team.",
    disableBeacon: true,
  },
  // Step 5: Production
  {
    target: "[data-tour='nav-production']",
    placement: "right",
    title: "Production",
    content:
      "Manage your production workflow. Track tasks, assign team members, and monitor progress from ideation to final delivery.",
    disableBeacon: true,
  },
  // Step 6: Library
  {
    target: "[data-tour='nav-library']",
    placement: "right",
    title: "Library",
    content:
      "Build your reference library. Upload sample ads and let AI analyze their style, hooks, and visual elements for inspiration.",
    disableBeacon: true,
  },
  // Step 7: Settings
  {
    target: "[data-tour='nav-settings']",
    placement: "right",
    title: "Settings",
    content:
      "Configure your company profile and brand voice. This helps AI generate content that matches your brand's tone and style.",
    disableBeacon: true,
  },
  // Step 8: Getting Started
  {
    target: "[data-tour='quick-actions']",
    placement: "top",
    title: "Ready to Start?",
    content:
      "Begin by adding a product in Ideation > Products. Then create an ICP (Ideal Customer Profile) and generate your first ad concepts!",
    disableBeacon: true,
  },
];

export const TUTORIAL_STORAGE_KEY = "adflow-tutorial-completed";
