"use client";

import { Check, Download, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { rbacConfig } from "@/config/rbac";

export function RbacMatrix() {
  const initial = useMemo(
    () => Object.fromEntries(
      Object.entries(rbacConfig.rolePermissions).flatMap(([role, permissions]) =>
        Object.keys(rbacConfig.permissions).map((permission) => [
          `${role}:${permission}`,
          permissions.includes("*") || permissions.includes(permission),
        ]),
      ),
    ),
    [],
  );
  const [matrix, setMatrix] = useState<Record<string, boolean>>(initial);
  const [dirty, setDirty] = useState(false);
  const [storageMode, setStorageMode] = useState<"loading" | "postgres" | "policy-as-code">("loading");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/rbac")
      .then(async (response) => {
        if (!response.ok) throw new Error("Access policy could not be loaded.");
        return response.json() as Promise<{ rolePermissions: Record<string, string[]>; mode: "postgres" | "policy-as-code" }>;
      })
      .then((data) => {
        if (!active) return;
        const loaded = Object.fromEntries(
          Object.entries(data.rolePermissions).flatMap(([role, permissions]) =>
            Object.keys(rbacConfig.permissions).map((permission) => [
              `${role}:${permission}`,
              permissions.includes("*") || permissions.includes(permission),
            ]),
          ),
        );
        setMatrix(loaded);
        setStorageMode(data.mode);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStorageMode("policy-as-code");
        setStatus(error instanceof Error ? error.message : "Access policy could not be loaded.");
      });
    return () => { active = false; };
  }, []);

  function toggle(role: string, permission: string) {
    if (role === "owner") return;
    const key = `${role}:${permission}`;
    setMatrix((current) => ({ ...current, [key]: !current[key] }));
    setDirty(true);
    setStatus("");
  }

  function currentPolicy() {
    return Object.fromEntries(
      Object.keys(rbacConfig.roles).map((role) => [
        role,
        Object.keys(rbacConfig.permissions).filter((permission) => matrix[`${role}:${permission}`]),
      ]),
    );
  }

  function exportPolicy() {
    const policy = currentPolicy();
    const blob = new Blob([JSON.stringify({ rolePermissions: policy }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "rbac-policy.json";
    link.click();
    URL.revokeObjectURL(href);
  }

  async function savePolicy() {
    setStatus("Saving reviewed policy…");
    const response = await fetch("/api/admin/rbac", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rolePermissions: currentPolicy() }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setStatus(result.error ?? "Policy could not be saved.");
      return;
    }
    setDirty(false);
    setStatus("Policy saved to PostgreSQL and active for server authorization.");
  }

  return (
    <div className="access-page">
      <header className="page-heading">
        <div><p className="mono-label">SECURITY / POLICY AS CODE</p><h1>Role-based access</h1><p>Preview feature permissions and export a reviewed policy for deployment.</p></div>
        <div className="heading-actions"><button className="secondary-button" onClick={() => { setMatrix(initial); setDirty(false); setStatus(""); }} disabled={!dirty}><RotateCcw size={15} /> Reset</button><button className="secondary-button" onClick={exportPolicy}><Download size={15} /> Export</button><button className="primary-button" onClick={() => void savePolicy()} disabled={!dirty || storageMode !== "postgres"}><Save size={15} /> Save changes</button></div>
      </header>
      <div className="security-banner"><ShieldCheck size={19} /><div><strong>Server-enforced authorization</strong><p>{storageMode === "postgres" ? "Changes are stored in PostgreSQL, audited, and enforced by protected server routes." : "Connect PostgreSQL to save live policy. Until then, preview and export a reviewed policy for deployment."}</p></div></div>
      <div className="matrix-wrap">
        <table className="access-matrix">
          <thead><tr><th>Capability</th>{Object.entries(rbacConfig.roles).map(([role, detail]) => <th key={role}><span>{detail.label}</span><small>{role}</small></th>)}</tr></thead>
          <tbody>{Object.entries(rbacConfig.permissions).map(([permission, label]) => <tr key={permission}><th><span>{label}</span><small>{permission}</small></th>{Object.keys(rbacConfig.roles).map((role) => { const enabled = matrix[`${role}:${permission}`]; return <td key={role}><button className={`permission-toggle ${enabled ? "enabled" : ""}`} onClick={() => toggle(role, permission)} disabled={role === "owner"} aria-label={`${enabled ? "Remove" : "Grant"} ${permission} for ${role}`}>{enabled && <Check size={14} />}</button></td>; })}</tr>)}</tbody>
        </table>
      </div>
      <section className="mapping-grid"><div><p className="mono-label">IDENTITY GROUP</p><strong>Maps to application role</strong></div>{Object.entries(rbacConfig.identityGroupMappings).map(([group, role]) => <div className="mapping-row" key={group}><code>{group}</code><span>→</span><b>{rbacConfig.roles[role as keyof typeof rbacConfig.roles]?.label ?? role}</b></div>)}</section>
      {(dirty || status) && <p className="draft-note">{status || (storageMode === "postgres" ? "Unsaved changes are not active yet." : "This is a local draft. Export it and update src/config/rbac.ts through change control, or connect PostgreSQL to save it directly.")}</p>}
    </div>
  );
}
