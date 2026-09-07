"use client";

import { ArrowRight, Building2, Check, ShieldCheck, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

import { product } from "@/config/product";

export function SignInCard({ demoEnabled, enterpriseEnabled }: { demoEnabled: boolean; enterpriseEnabled: boolean }) {
  const [pending, setPending] = useState<string | null>(null);

  function startSignIn(provider: string, userId?: string) {
    setPending(userId ?? provider);
    void signIn(provider, { callbackUrl: "/", ...(userId ? { userId } : {}) });
  }

  return (
    <main className="landing-shell">
      <div className="landing-grid" aria-hidden="true" />
      <section className="landing-copy">
        <a className="brand-lockup" href="https://conseiltek.com" aria-label="ConseilTek home">
          <Image src="/brand/mark.png" width={72} height={31} alt="ConseilTek" priority />
          <span>TECHTONS / {product.name.toUpperCase()}</span>
        </a>
        <div className="eyebrow"><span /> OWNED SOFTWARE · AI NATIVE</div>
        <h1>{product.tagline}</h1>
        <p className="landing-lede">{product.description}</p>
        <div className="capability-row">
          <span><ShieldCheck size={16} /> Enterprise SSO</span>
          <span><Building2 size={16} /> Self-hosted</span>
          <span><Sparkles size={16} /> AI assisted</span>
        </div>
        <div className="truth-card">
          <p className="truth-kicker">THE CONSEILTEK DIFFERENCE</p>
          <p>Your workflow, data, identity, and deployment stay in your environment.</p>
          <ul>
            <li><Check size={15} /> Apache-2.0 source</li>
            <li><Check size={15} /> AWS Terraform + Azure Bicep</li>
            <li><Check size={15} /> Configurable feature-level RBAC</li>
          </ul>
        </div>
      </section>

      <section className="sign-in-panel" aria-labelledby="sign-in-heading">
        <div className="sign-in-heading">
          <p className="mono-label">SECURE WORKSPACE</p>
          <h2 id="sign-in-heading">Open {product.name}</h2>
          <p>Use enterprise identity or choose a demo persona to inspect role-based access.</p>
        </div>

        {enterpriseEnabled && (
          <button className="primary-action" onClick={() => startSignIn("enterprise-sso")} disabled={Boolean(pending)}>
            Continue with enterprise SSO
            <ArrowRight size={17} />
          </button>
        )}

        {demoEnabled && (
          <div className="demo-section">
            <div className="divider"><span>DEMO WORKSPACE</span></div>
            <div className="persona-list">
              {product.demoUsers.map((user) => (
                <button
                  className="persona"
                  key={user.id}
                  onClick={() => startSignIn("demo", user.id)}
                  disabled={Boolean(pending)}
                >
                  <span className="avatar">{user.name.split(" ").map((part) => part[0]).join("")}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.label}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
            <p className="demo-note">Demo access is disabled automatically in production unless explicitly enabled.</p>
          </div>
        )}

        {!enterpriseEnabled && !demoEnabled && (
          <div className="configuration-note">
            No identity provider is configured. Set the OIDC environment variables described in docs/AUTHENTICATION.md.
          </div>
        )}
      </section>
    </main>
  );
}
