import { NextResponse } from "next/server";

import { product } from "@/config/product";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    application: product.id,
    version: process.env.APP_VERSION ?? "development",
    capabilities: {
      database: Boolean(process.env.DATABASE_URL || process.env.PGHOST),
      redis: Boolean(process.env.REDIS_URL),
      enterpriseSso: Boolean(process.env.OIDC_ISSUER),
      ai: Boolean(process.env.OPENAI_API_KEY),
      rag: Boolean(process.env.OPENAI_VECTOR_STORE_ID),
    },
  });
}
