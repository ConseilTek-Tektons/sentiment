"use client";

import {
  Bell,
  Bot,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, useState } from "react";

import { product } from "@/config/product";
import { AiAssistant } from "./ai-assistant";

type UserSummary = { name?: string | null; email?: string | null; roles: string[] };

export function AppShell({ user, children }: { user: UserSummary; children: ReactNode }) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const initials = (user.name ?? user.email ?? "User")
    .split(/[ @]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="app-brand" href="/">
          <Image src="/brand/mark.png" alt="ConseilTek" width={61} height={26} priority />
          <span><strong>{product.name}</strong><small>by ConseilTek</small></span>
        </Link>
        <nav className="primary-nav" aria-label="Application">
          <Link className="nav-item active" href="/"><LayoutDashboard size={17} /><span>Overview</span></Link>
          {product.nav.map((item) => (
            <button className="nav-item" key={item.label} type="button">
              <span className="nav-dot" />
              <span>{item.label}</span>
              {item.badge && <small>{item.badge}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link className="nav-item" href="/admin/access"><ShieldCheck size={17} /><span>Access control</span></Link>
          <button className="nav-item" type="button"><Settings size={17} /><span>Settings</span></button>
          <div className="user-card">
            <span className="avatar">{initials}</span>
            <span><strong>{user.name ?? "Workspace user"}</strong><small>{user.roles.join(", ")}</small></span>
            <button onClick={() => void signOut({ callbackUrl: "/" })} aria-label="Sign out"><LogOut size={15} /></button>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="workspace-switcher"><span className="status-dot" /> Northstar / Production <ChevronDown size={14} /></button>
          <div className="topbar-actions">
            <label className="global-search"><Search size={15} /><input aria-label="Search workspace" placeholder="Search" /><kbd>⌘ K</kbd></label>
            <button className="icon-button" aria-label="Help"><HelpCircle size={18} /></button>
            <button className="icon-button has-alert" aria-label="Notifications"><Bell size={18} /></button>
            <button className="assistant-trigger" onClick={() => setAssistantOpen(true)}><Bot size={16} /> Ask {product.ai.name}</button>
          </div>
        </header>
        <main className="workspace-main">{children}</main>
      </div>
      <AiAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
