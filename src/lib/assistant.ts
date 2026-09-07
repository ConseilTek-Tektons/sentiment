export type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
};

const stopWords = new Set([
  "about",
  "after",
  "could",
  "from",
  "have",
  "into",
  "that",
  "their",
  "there",
  "these",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
]);

function terms(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term));
}

export function retrieveLocalKnowledge(
  question: string,
  articles: readonly KnowledgeArticle[],
  limit = 3,
): KnowledgeArticle[] {
  const query = terms(question);
  return articles
    .map((article) => {
      const titleTerms = new Set(terms(article.title));
      const tagTerms = new Set(article.tags.flatMap(terms));
      const bodyTerms = new Set(terms(`${article.summary} ${article.content}`));
      const score = query.reduce(
        (total, term) =>
          total +
          (titleTerms.has(term) ? 5 : 0) +
          (tagTerms.has(term) ? 3 : 0) +
          (bodyTerms.has(term) ? 1 : 0),
        0,
      );
      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ article }) => article);
}

export function buildLocalAnswer(question: string, articles: readonly KnowledgeArticle[]) {
  const matches = retrieveLocalKnowledge(question, articles);
  if (!matches.length) {
    return {
      answer:
        "I could not find a supported answer in the local operations knowledge. Connect a vector store or add an article under knowledge/ for this topic.",
      citations: [],
    };
  }

  return {
    answer: matches.map((article) => `${article.title}: ${article.summary}`).join("\n\n"),
    citations: matches.map((article) => ({ id: article.id, title: article.title })),
  };
}
