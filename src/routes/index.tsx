import { createFileRoute } from "@tanstack/react-router";
import { WanderWiseApp } from "@/components/wanderwise/WanderWiseApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WanderWise — AI Travel Discovery" },
      { name: "description", content: "Describe your ideal trip naturally and discover stays matched to your budget, preferences, and travel style." },
      { property: "og:title", content: "WanderWise — AI Travel Discovery" },
      { property: "og:description", content: "Travel smarter with personalized stay recommendations and clear reasons for every match." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WanderWiseApp,
});
