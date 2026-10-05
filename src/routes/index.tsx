import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scheme Connect — Farmer Scheme Assistant" },
      {
        name: "description",
        content: "Discover agricultural schemes, check eligibility and get mock AI guidance.",
      },
      { property: "og:title", content: "Scheme Connect — Farmer Scheme Assistant" },
      {
        property: "og:description",
        content: "Discover agricultural schemes, check eligibility and get mock AI guidance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
