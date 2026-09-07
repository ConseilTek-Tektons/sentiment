export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  label: string;
};

export type ProductConfig = {
  id: "openslot" | "sentiment" | "roster";
  name: string;
  category: string;
  tagline: string;
  description: string;
  repositoryUrl: string;
  nav: { label: string; badge?: string }[];
  demoUsers: DemoUser[];
  ai: {
    name: string;
    description: string;
    systemPrompt: string;
    suggestedQuestions: string[];
  };
};
