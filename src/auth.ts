import type { NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import CredentialsProvider from "next-auth/providers/credentials";

import { product } from "@/config/product";
import { resolveRolesFromClaims } from "@/lib/rbac";

const demoEnabled =
  process.env.AUTH_DEMO_MODE === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.AUTH_DEMO_MODE !== "false");

const providers: NextAuthOptions["providers"] = [];

if (demoEnabled) {
  providers.push(
    CredentialsProvider({
      id: "demo",
      name: "Demo workspace",
      credentials: {
        userId: { label: "Demo user", type: "text" },
      },
      async authorize(credentials) {
        const user = product.demoUsers.find((item) => item.id === credentials?.userId);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: [user.role],
        };
      },
    }),
  );
}

if (
  process.env.OIDC_ISSUER &&
  process.env.OIDC_CLIENT_ID &&
  process.env.OIDC_CLIENT_SECRET
) {
  const issuer = process.env.OIDC_ISSUER.replace(/\/$/, "");
  const enterpriseProvider: OAuthConfig<Record<string, unknown>> = {
    id: "enterprise-sso",
    name: process.env.OIDC_PROVIDER_NAME ?? "Enterprise SSO",
    type: "oauth",
    wellKnown: `${issuer}/.well-known/openid-configuration`,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    authorization: {
      params: {
        scope: process.env.OIDC_SCOPES ?? "openid profile email groups",
      },
    },
    idToken: true,
    checks: ["pkce", "state"],
    profile(profile) {
      return {
        id: String(profile.sub),
        name: typeof profile.name === "string" ? profile.name : undefined,
        email: typeof profile.email === "string" ? profile.email : undefined,
        roles: resolveRolesFromClaims(profile),
      };
    },
  };
  providers.push(enterpriseProvider);
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.roles) token.roles = user.roles;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.roles = token.roles ?? [];
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.info("security.auth.sign_in", {
        userId: user.id,
        providerConfigured: Boolean(process.env.OIDC_ISSUER),
      });
    },
  },
};

export { demoEnabled };
