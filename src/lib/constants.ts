// AdFlow Constants

export const PLATFORMS = [
  { value: "Meta", label: "Meta (Facebook/Instagram)" },
  { value: "TikTok", label: "TikTok" },
  { value: "YouTube", label: "YouTube" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Twitter", label: "Twitter/X" },
] as const;

export const AD_FORMATS = [
  {
    value: "UGC Testimonial",
    label: "UGC Testimonial",
    description: "User-generated style testimonial video",
  },
  {
    value: "Product Demo",
    label: "Product Demo",
    description: "Showcasing product features and functionality",
  },
  {
    value: "Before/After",
    label: "Before/After",
    description: "Transformation or comparison showing results",
  },
  {
    value: "Problem-Solution",
    label: "Problem-Solution",
    description: "Present a problem, then show how product solves it",
  },
  {
    value: "Unboxing",
    label: "Unboxing",
    description: "First impressions and product reveal",
  },
  {
    value: "Tutorial",
    label: "Tutorial",
    description: "How-to or educational content featuring product",
  },
  {
    value: "Lifestyle",
    label: "Lifestyle",
    description: "Product integrated into aspirational lifestyle content",
  },
  {
    value: "Talking Head",
    label: "Talking Head",
    description: "Direct-to-camera presentation",
  },
  {
    value: "Mashup",
    label: "Mashup",
    description: "Compilation of multiple clips or testimonials",
  },
] as const;

export const HOOK_TYPES = [
  {
    value: "Question",
    label: "Question Hook",
    description: 'Opens with a question ("Have you ever...")',
    examples: [
      "Have you ever wondered why...",
      "What if I told you...",
      "Do you struggle with...",
    ],
  },
  {
    value: "Statement",
    label: "Statement Hook",
    description: 'Bold statement to capture attention ("This changed everything...")',
    examples: [
      "This changed everything for me",
      "I never believed it until...",
      "The truth about...",
    ],
  },
  {
    value: "Controversial",
    label: "Controversial Hook",
    description: 'Challenges conventional thinking ("Stop doing X...")',
    examples: [
      "Stop wasting money on...",
      "Everything you know about X is wrong",
      "The industry doesn't want you to know...",
    ],
  },
  {
    value: "Curiosity",
    label: "Curiosity Hook",
    description: 'Creates intrigue ("The secret to...")',
    examples: [
      "The secret to...",
      "Here's what nobody tells you about...",
      "The one thing that...",
    ],
  },
  {
    value: "Pain Point",
    label: "Pain Point Hook",
    description: 'Addresses frustration directly ("Tired of...")',
    examples: [
      "Tired of...",
      "Frustrated with...",
      "If you're still dealing with...",
    ],
  },
  {
    value: "Social Proof",
    label: "Social Proof Hook",
    description: "Leads with credibility or results",
    examples: [
      "10,000 customers can't be wrong",
      "Why everyone is switching to...",
      "The #1 rated...",
    ],
  },
] as const;

export const ANGLES = [
  {
    value: "Feature-focused",
    label: "Feature-focused",
    description: "Highlight specific product features and specs",
  },
  {
    value: "Benefit-focused",
    label: "Benefit-focused",
    description: "Focus on the outcomes and benefits for the user",
  },
  {
    value: "Problem-solution",
    label: "Problem-solution",
    description: "Frame around solving a specific problem",
  },
  {
    value: "Social proof",
    label: "Social Proof",
    description: "Leverage testimonials, reviews, and popularity",
  },
  {
    value: "Scarcity",
    label: "Scarcity/Urgency",
    description: "Create urgency through limited time or availability",
  },
  {
    value: "Lifestyle",
    label: "Lifestyle/Aspiration",
    description: "Connect to aspirational lifestyle or identity",
  },
  {
    value: "Comparison",
    label: "Comparison",
    description: "Compare against alternatives or competitors",
  },
  {
    value: "Educational",
    label: "Educational",
    description: "Teach something valuable related to the product",
  },
] as const;

export const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16 (Stories/Reels/TikTok)" },
  { value: "1:1", label: "1:1 (Feed Square)" },
  { value: "16:9", label: "16:9 (YouTube/Landscape)" },
  { value: "4:5", label: "4:5 (Feed Portrait)" },
] as const;

export const DURATIONS = [
  { value: 15, label: "15 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 45, label: "45 seconds" },
  { value: 60, label: "60 seconds" },
  { value: 90, label: "90 seconds" },
] as const;

// Navigation items
export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
  },
  {
    title: "Ideation",
    href: "/ideation",
    icon: "Lightbulb",
    children: [
      { title: "Overview", href: "/ideation" },
      { title: "Products", href: "/ideation/products" },
      { title: "ICPs", href: "/ideation/icps" },
      { title: "Generate Concepts", href: "/ideation/generate" },
      { title: "Review Concepts", href: "/ideation/concepts" },
    ],
  },
  {
    title: "Scripting",
    href: "/scripting",
    icon: "FileText",
    disabled: true,
  },
  {
    title: "Production",
    href: "/production",
    icon: "Video",
    disabled: true,
  },
  {
    title: "Library",
    href: "/library",
    icon: "Library",
    children: [
      { title: "Hooks", href: "/library/hooks" },
      { title: "Formats", href: "/library/formats" },
      { title: "Angles", href: "/library/angles" },
    ],
    disabled: true,
  },
] as const;
