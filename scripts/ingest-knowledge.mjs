import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const vectorStore = process.env.OPENAI_VECTOR_STORE_ID
  ? { id: process.env.OPENAI_VECTOR_STORE_ID }
  : await client.vectorStores.create({ name: `${process.env.APP_NAME ?? "Techtons"} knowledge` });

const directory = path.join(process.cwd(), "knowledge");
const files = (await readdir(directory)).filter((file) => file.endsWith(".md")).sort();
for (const fileName of files) {
  const file = await client.files.create({
    file: createReadStream(path.join(directory, fileName)),
    purpose: "assistants",
  });
  await client.vectorStores.files.create(vectorStore.id, { file_id: file.id });
  console.info(`Queued ${fileName}`);
}

console.info(`OPENAI_VECTOR_STORE_ID=${vectorStore.id}`);
