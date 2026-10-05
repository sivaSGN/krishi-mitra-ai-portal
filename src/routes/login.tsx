import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/login-page";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Scheme Connect" },
      {
        name: "description",
        content: "Sign in to Scheme Connect to view and apply for agricultural schemes.",
      },
      { property: "og:title", content: "Login — Scheme Connect" },
      {
        property: "og:description",
        content: "Sign in to Scheme Connect to view and apply for agricultural schemes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});
