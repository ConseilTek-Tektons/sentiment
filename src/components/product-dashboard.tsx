"use client";

import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  EyeOff,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { hasPermission } from "@/lib/rbac";
import { visibleCohorts } from "@/lib/anonymity";

const drivers = [
  { name: "Purpose", current: 82, previous: 79 },
  { name: "Enablement", current: 78, previous: 69 },
  { name: "Belonging", current: 75, previous: 73 },
  { name: "Manager", current: 68, previous: 68 },
  { name: "Growth", current: 72, previous: 70 },
];

const cohorts = visibleCohorts([
  { cohort: "Engineering", respondents: 126, score: 79, change: 5 },
  { cohort: "Go-to-market", respondents: 94, score: 73, change: 2 },
  { cohort: "Operations", respondents: 51, score: 77, change: 7 },
  { cohort: "Product · New York", respondents: 4, score: 64, change: -3 },
], 5);

export function ProductDashboard({ roles }: { roles: string[] }) {
  const [notice, setNotice] = useState("");
  const canManageSurveys = hasPermission(roles, "surveys.manage");

  function launchPulse() {
    setNotice("September manager effectiveness pulse is ready for final review.");
  }

  return (
    <>
      <header className="page-heading">
        <div><p className="mono-label">PEOPLE HEALTH · Q3</p><h1>People signals, without guesswork.</h1><p>542 of 600 people responded · results updated 18 minutes ago</p></div>
        <div className="heading-actions"><button className="secondary-button"><BarChart3 size={15} /> Explore results</button>{canManageSurveys && <button className="primary-button" onClick={launchPulse}><Plus size={16} /> Launch pulse</button>}</div>
      </header>

      {notice && <div className="notice" role="status"><CheckCircle2 size={16} /> {notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}

      <section className="metric-grid" aria-label="People metrics">
        <article className="metric-card featured"><div className="metric-top"><span>Engagement score</span><TrendingUp size={17} /></div><strong>76</strong><p><span className="positive">↗ 4 pts</span> from May pulse</p><div className="progress-track"><span style={{ width: "76%" }} /></div></article>
        <article className="metric-card"><div className="metric-top"><span>Response rate</span><Users size={17} /></div><strong>90.3%</strong><p><span className="positive">+3.8 pts</span> above target</p><div className="comparison"><span>542 responses</span><b>600 invited</b></div></article>
        <article className="metric-card"><div className="metric-top"><span>Review completion</span><ClipboardCheck size={17} /></div><strong>84%</strong><p><span className="warning">47 packets</span> due Friday</p><div className="progress-track"><span style={{ width: "84%" }} /></div></article>
        <article className="metric-card"><div className="metric-top"><span>Goals on track</span><Target size={17} /></div><strong>72%</strong><p><span className="positive">↗ 6 pts</span> after check-ins</p><div className="status-row"><span /><span /><span /><span className="warn" /></div></article>
      </section>

      <div className="dashboard-grid sentiment-grid">
        <section className="surface">
          <header className="surface-header"><div><h2>Engagement drivers</h2><p>Current pulse compared with May · anonymity threshold 5</p></div><button className="quiet-chip">Company ▾</button></header>
          <div className="driver-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={drivers} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
                <CartesianGrid stroke="#292929" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#666" fontSize={9} />
                <YAxis type="category" dataKey="name" width={72} stroke="#999" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#171717", border: "1px solid #333", borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="previous" fill="#343434" radius={[0, 3, 3, 0]} barSize={8} />
                <Bar dataKey="current" fill="#a3ff12" radius={[0, 3, 3, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-row"><span><i className="current" /> Current</span><span><i /> May pulse</span><button>Open driver analysis <ArrowUpRight size={13} /></button></div>
        </section>

        <div className="side-stack">
          <section className="surface cohort-surface">
            <header className="surface-header"><div><h2>Cohort view</h2><p>Query-time privacy controls</p></div><ShieldCheck size={18} /></header>
            <div className="cohort-list">
              {cohorts.map((cohort) => <div className="cohort-row" key={cohort.cohort}><div><strong>{cohort.cohort}</strong><small>{cohort.respondents} respondents</small></div>{cohort.masked ? <span className="masked"><EyeOff size={13} /> Hidden</span> : <><b>{cohort.visibleScore}</b><span className={cohort.change >= 0 ? "positive" : "warning"}>{cohort.change >= 0 ? "+" : ""}{cohort.visibleChange}</span></>}</div>)}
            </div>
          </section>
          <section className="insight-card"><span className="insight-icon"><Sparkles size={18} /></span><div><p className="mono-label">AI INSIGHT · AGGREGATE ONLY</p><h3>Enablement is moving.</h3><p>Tooling clarity appears in 31% more positive comments. Manager effectiveness is flat and remains the highest-leverage action area.</p><button>Draft an action plan <ArrowUpRight size={14} /></button></div></section>
        </div>
      </div>

      <div className="lower-grid">
        <section className="surface"><header className="surface-header"><div><h2>Active cycles</h2><p>Survey and performance operations</p></div><ClipboardCheck size={18} /></header><div className="cycle-list"><div><span className="cycle-icon lime"><MessageSquareText size={16} /></span><div><strong>Q3 engagement pulse</strong><small>Live · closes Sep 11</small></div><b>90%</b></div><div><span className="cycle-icon violet"><ClipboardCheck size={16} /></span><div><strong>Mid-year performance</strong><small>Manager review · 47 remaining</small></div><b>84%</b></div><div><span className="cycle-icon cyan"><Target size={16} /></span><div><strong>Q3 goal check-in</strong><small>Starts Sep 14</small></div><b>Ready</b></div></div></section>
        <section className="surface"><header className="surface-header"><div><h2>Action plan</h2><p>Manager effectiveness · owned by People Ops</p></div><Target size={18} /></header><div className="action-plan"><div className="action-progress"><span style={{ width: "58%" }} /></div><div className="action-meta"><span><b>7</b> complete</span><span><b>4</b> in progress</span><span><b>1</b> blocked</span></div><p>Weekly priority reset adopted by 11 of 12 teams. Follow-up pulse scheduled for October 5.</p><button>Open action plan <ArrowUpRight size={13} /></button></div></section>
      </div>
    </>
  );
}
