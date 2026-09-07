"use client";

import { ArrowUp, BookOpen, Bot, LoaderCircle, Sparkles, X } from "lucide-react";
import { FormEvent, useState } from "react";

import { product } from "@/config/product";

type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: { id: string; title: string }[];
  mode?: string;
};

export function AiAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `I’m the ${product.ai.name}. ${product.ai.description}`,
      mode: "ready",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function ask(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 3 || loading) return;
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          context: { application: product.id, surface: "executive-dashboard" },
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        citations?: { id: string; title: string }[];
        mode?: string;
      };
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.answer ?? data.error ?? "The assistant could not complete that request.",
          citations: data.citations,
          mode: data.mode,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "The assistant service is currently unavailable." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <aside className={`assistant-panel ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <header className="assistant-header">
        <div className="assistant-icon"><Sparkles size={17} /></div>
        <div>
          <strong>{product.ai.name}</strong>
          <span>Grounded workspace assistant</span>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close assistant"><X size={18} /></button>
      </header>
      <div className="assistant-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
            {message.role === "assistant" && <Bot size={16} />}
            <div>
              {message.text.split("\n").map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}
              {message.citations && message.citations.length > 0 && (
                <div className="citations">
                  {message.citations.map((citation) => (
                    <span key={citation.id}><BookOpen size={12} /> {citation.title}</span>
                  ))}
                </div>
              )}
              {message.mode && message.mode !== "ready" && <small className="mode-badge">{message.mode}</small>}
            </div>
          </div>
        ))}
        {loading && <div className="message assistant"><LoaderCircle className="spin" size={16} /><p>Reviewing workspace context…</p></div>}
      </div>
      {messages.length === 1 && (
        <div className="suggested-questions">
          {product.ai.suggestedQuestions.map((item) => (
            <button key={item} onClick={() => void ask(item)}>{item}</button>
          ))}
        </div>
      )}
      <form className="assistant-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="assistant-question">Ask a question</label>
        <textarea
          id="assistant-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this workspace…"
          rows={2}
          maxLength={1200}
        />
        <button type="submit" disabled={question.trim().length < 3 || loading} aria-label="Send question"><ArrowUp size={17} /></button>
      </form>
    </aside>
  );
}
