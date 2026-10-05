import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "@/pages/register-page";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — Scheme Connect" },
      {
        name: "description",
        content: "Register your farmer profile on Scheme Connect to find personalized government schemes.",
      },
      { property: "og:title", content: "Create Account — Scheme Connect" },
      {
        property: "og:description",
        content: "Register your farmer profile on Scheme Connect to find personalized government schemes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});
