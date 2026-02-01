import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Hook Templates
  const hookTemplates = [
    {
      type: "Question",
      template: "Have you ever {situation}?",
      examples: [
        "Have you ever wondered why your skin looks dull?",
        "Have you ever wished you could sleep better?",
        "Have you ever struggled to find the right fit?",
      ],
      performance: "High engagement, great for awareness campaigns",
    },
    {
      type: "Statement",
      template: "This {noun} changed everything for me",
      examples: [
        "This product changed everything for me",
        "This simple trick changed my mornings",
        "This discovery transformed my skin",
      ],
      performance: "Strong for testimonial-style content",
    },
    {
      type: "Controversial",
      template: "Stop {common action} right now",
      examples: [
        "Stop using cotton swabs in your ears",
        "Stop doing crunches for abs",
        "Stop wasting money on expensive skincare",
      ],
      performance: "High scroll-stop rate, use sparingly",
    },
    {
      type: "Curiosity",
      template: "The secret to {desired outcome}",
      examples: [
        "The secret to glowing skin at 40",
        "The secret top performers won't tell you",
        "The secret ingredient in every viral recipe",
      ],
      performance: "Good click-through, build intrigue",
    },
    {
      type: "Pain Point",
      template: "Tired of {frustration}?",
      examples: [
        "Tired of waking up exhausted?",
        "Tired of clothes that don't fit right?",
        "Tired of spending hours on meal prep?",
      ],
      performance: "Direct response, high conversion intent",
    },
    {
      type: "Social Proof",
      template: "{number} people can't be wrong",
      examples: [
        "10,000 5-star reviews can't be wrong",
        "Join the 50,000 people who switched",
        "The #1 rated app for a reason",
      ],
      performance: "Trust-building, good for consideration stage",
    },
  ];

  for (const hook of hookTemplates) {
    const data = {
      type: hook.type,
      template: hook.template,
      examples: JSON.stringify(hook.examples),
      performance: hook.performance,
    };
    await prisma.hookTemplate.upsert({
      where: { id: hook.type.toLowerCase() },
      update: data,
      create: { id: hook.type.toLowerCase(), ...data },
    });
  }
  console.log(`Seeded ${hookTemplates.length} hook templates`);

  // Seed Format Templates
  const formatTemplates = [
    {
      id: "ugc-testimonial",
      name: "UGC Testimonial",
      description:
        "User-generated content style testimonial where a real person shares their experience with the product. Feels authentic and relatable.",
      platforms: ["Meta", "TikTok", "YouTube"],
      structure: {
        sections: [
          { name: "Hook", duration: "0-3s", description: "Attention-grabbing opener" },
          { name: "Problem", duration: "3-8s", description: "Relatable problem statement" },
          { name: "Discovery", duration: "8-15s", description: "How they found the product" },
          { name: "Results", duration: "15-25s", description: "Their experience and results" },
          { name: "CTA", duration: "25-30s", description: "Recommendation and call to action" },
        ],
      },
    },
    {
      id: "product-demo",
      name: "Product Demo",
      description:
        "Showcases the product's features and functionality in action. Great for demonstrating unique capabilities.",
      platforms: ["Meta", "YouTube", "TikTok"],
      structure: {
        sections: [
          { name: "Hook", duration: "0-3s", description: "Problem or intrigue" },
          { name: "Introduction", duration: "3-8s", description: "Product reveal" },
          { name: "Feature 1", duration: "8-15s", description: "Key feature demonstration" },
          { name: "Feature 2", duration: "15-22s", description: "Secondary feature" },
          { name: "Benefits", duration: "22-27s", description: "Summarize benefits" },
          { name: "CTA", duration: "27-30s", description: "Call to action" },
        ],
      },
    },
    {
      id: "before-after",
      name: "Before/After",
      description:
        "Shows transformation or comparison demonstrating clear results. Highly effective for visual products.",
      platforms: ["Meta", "TikTok"],
      structure: {
        sections: [
          { name: "Before State", duration: "0-8s", description: "Show the problem/before" },
          { name: "Transition", duration: "8-12s", description: "Introduce solution" },
          { name: "After State", duration: "12-22s", description: "Show results/after" },
          { name: "How It Works", duration: "22-27s", description: "Brief explanation" },
          { name: "CTA", duration: "27-30s", description: "Call to action" },
        ],
      },
    },
    {
      id: "problem-solution",
      name: "Problem-Solution",
      description:
        "Classic advertising structure that presents a relatable problem then positions the product as the solution.",
      platforms: ["Meta", "YouTube", "TikTok"],
      structure: {
        sections: [
          { name: "Problem Hook", duration: "0-5s", description: "Agitate the problem" },
          { name: "Problem Expansion", duration: "5-12s", description: "Why it matters" },
          { name: "Solution Intro", duration: "12-18s", description: "Introduce product" },
          { name: "How It Solves", duration: "18-25s", description: "Explain the solution" },
          { name: "CTA", duration: "25-30s", description: "Call to action" },
        ],
      },
    },
    {
      id: "lifestyle",
      name: "Lifestyle",
      description:
        "Product integrated into aspirational lifestyle content. Focuses on emotion and identity rather than features.",
      platforms: ["Meta", "TikTok", "YouTube"],
      structure: {
        sections: [
          { name: "Scene Setting", duration: "0-5s", description: "Aspirational lifestyle" },
          { name: "Day in Life", duration: "5-15s", description: "Product in context" },
          { name: "Benefit Moment", duration: "15-22s", description: "Key benefit shown" },
          { name: "Brand Moment", duration: "22-27s", description: "Brand/product focus" },
          { name: "CTA", duration: "27-30s", description: "Call to action" },
        ],
      },
    },
  ];

  for (const format of formatTemplates) {
    const data = {
      id: format.id,
      name: format.name,
      description: format.description,
      platforms: JSON.stringify(format.platforms),
      structure: JSON.stringify(format.structure),
    };
    await prisma.formatTemplate.upsert({
      where: { id: format.id },
      update: data,
      create: data,
    });
  }
  console.log(`Seeded ${formatTemplates.length} format templates`);

  // Seed Angle Templates
  const angleTemplates = [
    {
      id: "feature-focused",
      name: "Feature-focused",
      description:
        "Highlights specific product features, specifications, and technical capabilities. Best for products with unique innovations.",
      bestFor: ["Tech products", "Tools", "Software", "Appliances"],
    },
    {
      id: "benefit-focused",
      name: "Benefit-focused",
      description:
        "Focuses on the outcomes and benefits for the user rather than the product itself. Answers 'what's in it for me?'",
      bestFor: ["Health products", "Services", "Lifestyle products", "Most B2C"],
    },
    {
      id: "problem-solution",
      name: "Problem-solution",
      description:
        "Frames the narrative around solving a specific pain point. Great for products that address clear problems.",
      bestFor: ["Pain relief", "Productivity tools", "Cleaning products", "Any problem-solver"],
    },
    {
      id: "social-proof",
      name: "Social Proof",
      description:
        "Leverages testimonials, reviews, popularity, and authority to build trust and credibility.",
      bestFor: ["New brands", "Premium products", "Services", "Trust-dependent purchases"],
    },
    {
      id: "scarcity",
      name: "Scarcity/Urgency",
      description:
        "Creates urgency through limited time offers, limited availability, or exclusive access.",
      bestFor: ["Sales/promotions", "Limited editions", "Event-based", "High-intent audiences"],
    },
    {
      id: "lifestyle",
      name: "Lifestyle/Aspiration",
      description:
        "Connects the product to an aspirational lifestyle or identity. Emotional rather than rational appeal.",
      bestFor: ["Fashion", "Fitness", "Luxury", "Identity products"],
    },
  ];

  for (const angle of angleTemplates) {
    const data = {
      id: angle.id,
      name: angle.name,
      description: angle.description,
      bestFor: JSON.stringify(angle.bestFor),
    };
    await prisma.angleTemplate.upsert({
      where: { id: angle.id },
      update: data,
      create: data,
    });
  }
  console.log(`Seeded ${angleTemplates.length} angle templates`);

  // Seed a sample product and ICP for testing
  const sampleProductData = {
    id: "sample-product",
    name: "SleepWell Pro",
    description:
      "A revolutionary sleep tracking device that uses advanced sensors to monitor your sleep patterns and provide personalized recommendations for better rest.",
    features: JSON.stringify([
      "Advanced sleep tracking",
      "Smart alarm",
      "Sleep score",
      "Personalized insights",
      "7-day battery life",
    ]),
    usps: JSON.stringify([
      "Most accurate sleep tracker on the market",
      "AI-powered recommendations",
      "Non-invasive wearable design",
    ]),
    pricePoint: "$149",
    offers: "Free 30-day trial",
    imageUrls: JSON.stringify([]),
  };

  const sampleProduct = await prisma.product.upsert({
    where: { id: "sample-product" },
    update: {},
    create: sampleProductData,
  });
  console.log(`Seeded sample product: ${sampleProduct.name}`);

  const sampleICPData = {
    id: "sample-icp",
    name: "Busy Professionals",
    demographics: JSON.stringify({
      ageRange: "28-45",
      gender: "All",
      location: "Urban areas, US",
      income: "$75,000-$150,000",
    }),
    psychographics: JSON.stringify({
      interests: ["Health & wellness", "Productivity", "Technology", "Self-improvement"],
      values: ["Efficiency", "Health", "Work-life balance"],
      lifestyle: "Fast-paced, career-focused, health-conscious",
    }),
    painPoints: JSON.stringify([
      "Difficulty falling asleep",
      "Waking up tired despite sleeping",
      "Inconsistent sleep schedule",
      "Stress affecting sleep quality",
    ]),
    aspirations: JSON.stringify([
      "Wake up feeling refreshed",
      "Have more energy during the day",
      "Optimize performance",
      "Better work-life balance",
    ]),
    buyingTriggers: JSON.stringify([
      "Poor sleep affecting work performance",
      "Health scare or wake-up call",
      "New Year's resolutions",
      "Recommendation from trusted source",
    ]),
    platforms: JSON.stringify(["Meta", "YouTube", "LinkedIn"]),
  };

  const sampleICP = await prisma.iCP.upsert({
    where: { id: "sample-icp" },
    update: {},
    create: sampleICPData,
  });
  console.log(`Seeded sample ICP: ${sampleICP.name}`);

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
