import type { KnowledgeArticle } from "@/lib/assistant";

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "anonymity-threshold",
    title: "Anonymity threshold",
    summary: "Sentiment suppresses every aggregate cell with fewer than five respondents at query time. Filters and exports use the same enforcement function, so a hidden cohort cannot be recovered through another view.",
    content: "Responses and the employee directory are held separately. Analytics receives salted cohort identifiers and will not return score, change, distribution, or comments below the configured minimum.",
    tags: ["privacy", "anonymous", "threshold", "cohort", "hidden"],
  },
  {
    id: "engagement-movement",
    title: "Engagement movement",
    summary: "Overall engagement is 76, up four points. Enablement improved most after the tooling action plan; manager effectiveness is unchanged and remains the clearest intervention area.",
    content: "Compare like-for-like eligible cohorts and require at least two cycles before calling a movement a trend. Response-rate shifts should be disclosed next to score changes.",
    tags: ["engagement", "pulse", "improvement", "trend"],
  },
  {
    id: "manager-action",
    title: "Manager effectiveness action plan",
    summary: "Run a four-week expectation-setting practice: weekly priority reset, one blocked-work question in every 1:1, and a written decision log reviewed at the end of the month.",
    content: "The action plan must have an owner, due date, evidence of completion, and a follow-up pulse question. It is a recommendation, not a performance judgment about an individual manager.",
    tags: ["manager", "effectiveness", "action", "one-on-one"],
  },
  {
    id: "review-calibration",
    title: "Review calibration controls",
    summary: "Original ratings are immutable. Every calibration adjustment records the prior rating, new rating, actor, timestamp, and written rationale in the audit log.",
    content: "Peer scores stay hidden until submission to reduce anchoring. Visibility changes are versioned per stage and are evaluated server-side.",
    tags: ["review", "calibration", "ratings", "audit"],
  },
];
