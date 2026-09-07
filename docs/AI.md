# AI and grounded retrieval

The People insights copilot answers operational questions without becoming a security bypass. `/api/assistant` requires a valid session plus `assistant.ask`, validates the prompt, applies a per-user distributed rate limit, and attaches a one-way safety identifier to provider calls.

## Modes

1. **Local grounded mode** is the default when no API key is configured. It ranks approved knowledge records in `src/data/knowledge.ts` and returns the best evidence with sources. This keeps the demo useful and deterministic.
2. **OpenAI Responses mode** is enabled by `OPENAI_API_KEY`. It generates an answer from the retrieved application context with `store: false`.
3. **Hosted RAG mode** adds `OPENAI_VECTOR_STORE_ID`; the request uses the `file_search` tool against the approved vector store.

## Build the vector store

Put approved Markdown or text documents in `knowledge/`, then run:

```bash
OPENAI_API_KEY='<key>' pnpm knowledge:ingest
```

The script creates or reuses a vector store, uploads the corpus, waits for indexing, and prints the `OPENAI_VECTOR_STORE_ID` to configure in the runtime.

## Guardrails

- Assistant access is a distinct RBAC permission.
- Tenant identifiers are derived from the authenticated session.
- Retrieved context is treated as data, not as executable instruction.
- No tool can mutate surveys, reviews, or goals; the assistant is question-answering only.
- Keep secrets and personal data out of the knowledge corpus.
- Review provider retention, data residency, and model terms for the target organization.
- Log request metadata and cited source IDs, not raw secrets or unnecessary personal data.
