import { createHash } from "node:crypto";

import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/auth";
import { product } from "@/config/product";
import { knowledgeArticles } from "@/data/knowledge";
import { buildLocalAnswer, retrieveLocalKnowledge } from "@/lib/assistant";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hasEffectivePermission } from "@/lib/rbac-server";

export const runtime = "nodejs";

const bodySchema = z.object({
  question: z.string().trim().min(3).max(1200),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!await hasEffectivePermission(session.user.roles, "assistant.ask")) {
    return NextResponse.json({ error: "Your role cannot use the assistant." }, { status: 403 });
  }

  const rateLimit = await consumeRateLimit(`assistant:${session.user.id}`, 20, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Assistant rate limit reached. Try again shortly." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a question between 3 and 1,200 characters." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      ...buildLocalAnswer(parsed.data.question, knowledgeArticles),
      mode: "local-knowledge",
      remaining: rateLimit.remaining,
    });
  }

  const localContext = retrieveLocalKnowledge(parsed.data.question, knowledgeArticles);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
  const safetyIdentifier = createHash("sha256")
    .update(session.user.email ?? session.user.id)
    .digest("hex")
    .slice(0, 32);

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
    instructions: product.ai.systemPrompt,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `Question: ${parsed.data.question}`,
              `Workspace context: ${JSON.stringify(parsed.data.context ?? {})}`,
              `Local reference context: ${JSON.stringify(localContext)}`,
            ].join("\n\n"),
          },
        ],
      },
    ],
    tools: vectorStoreId
      ? [{ type: "file_search", vector_store_ids: [vectorStoreId], max_num_results: 6 }]
      : undefined,
    include: vectorStoreId ? ["file_search_call.results"] : undefined,
    safety_identifier: safetyIdentifier,
    store: false,
  });

  return NextResponse.json({
    answer: response.output_text,
    citations: localContext.map(({ id, title }) => ({ id, title })),
    mode: vectorStoreId ? "openai-rag" : "openai-context",
    responseId: response.id,
    remaining: rateLimit.remaining,
  });
}
