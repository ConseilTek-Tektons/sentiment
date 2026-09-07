import type { ProductConfig } from "./types";

export const product: ProductConfig = {
  id: "sentiment",
  name: "Sentiment",
  category: "People & HR",
  tagline: "Engagement and performance data your HR team owns.",
  description:
    "A privacy-first engagement, performance, one-on-one, and goals workspace with auditable anonymity controls.",
  repositoryUrl: "https://github.com/ConseilTek-Tektons/sentiment",
  nav: [
    { label: "Surveys", badge: "2" },
    { label: "Performance" },
    { label: "Goals" },
    { label: "1:1s" },
  ],
  demoUsers: [
    { id: "demo-admin", name: "Amina Foster", email: "amina@northstar.example", role: "hr_admin", label: "People administrator" },
    { id: "demo-manager", name: "Theo Martin", email: "theo@northstar.example", role: "manager", label: "People manager" },
    { id: "demo-employee", name: "Keiko Tan", email: "keiko@northstar.example", role: "employee", label: "Employee" },
  ],
  ai: {
    name: "People insights",
    description:
      "Ask about engagement themes, action plans, review operations, or anonymity-safe trends.",
    systemPrompt:
      "You are Sentiment's privacy-preserving people insights assistant. Use only supplied aggregate workspace context and retrieved policy material. Never infer or identify an individual respondent. Refuse requests that could pierce an anonymity threshold. Clearly distinguish observation from recommendation.",
    suggestedQuestions: [
      "What improved since the last pulse?",
      "Why is the Product cohort hidden?",
      "Suggest an action for manager effectiveness.",
    ],
  },
};
