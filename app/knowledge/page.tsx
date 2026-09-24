"use client";

import { useMemo, useState } from "react";
import { KnowledgeType, seedKnowledge } from "@/lib/domain";

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | KnowledgeType>("all");
  const entries = useMemo(() => seedKnowledge.filter((entry) => {
    const matchesType = type === "all" || entry.type === type;
    const haystack = [entry.title, entry.topic, entry.content, ...entry.tags].join(" ").toLowerCase();
    return matchesType && haystack.includes(query.toLowerCase());
  }), [query, type]);

  return <main className="module-page">
    <header className="module-header"><div><p className="eyebrow">Archive</p><h1>Knowledge</h1><p>Your growing body of notes, sources, ideas, insights, and questions.</p></div></header>
    <div className="toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search knowledge..." /><select value={type} onChange={(e) => setType(e.target.value as "all" | KnowledgeType)}><option value="all">All types</option><option value="note">Notes</option><option value="source">Sources</option><option value="idea">Ideas</option><option value="insight">Insights</option><option value="question">Questions</option></select></div>
    <section className="knowledge-grid">{entries.map((entry) => <article className="knowledge-card" key={entry.id}><div className="card-meta"><span>{entry.type}</span><span>{entry.topic}</span></div><h2>{entry.title}</h2><p>{entry.content}</p><div className="tag-row">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article>)}</section>
    {!entries.length && <div className="empty-state">No knowledge entries match this search.</div>}
  </main>;
}