"use client";

import { useState } from "react";

export default function JournalPage() {
  const [saved, setSaved] = useState(false);
  const [fields, setFields] = useState({ did: "", learned: "", mistakes: "", next: "" });
  function update(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  return <main className="module-page">
    <header className="module-header"><div><p className="eyebrow">Reflection</p><h1>Daily Journal</h1><p>Record the day so the system can eventually show patterns across months and years.</p></div></header>
    <section className="journal-grid">
      <label>What I did<textarea value={fields.did} onChange={(e) => update("did", e.target.value)} placeholder="Work, research, training, conversations..." /></label>
      <label>What I learned<textarea value={fields.learned} onChange={(e) => update("learned", e.target.value)} placeholder="New knowledge or changed understanding..." /></label>
      <label>Mistakes<textarea value={fields.mistakes} onChange={(e) => update("mistakes", e.target.value)} placeholder="What went wrong or could be improved?" /></label>
      <label>Next<textarea value={fields.next} onChange={(e) => update("next", e.target.value)} placeholder="What should happen next?" /></label>
    </section>
    <button className="primary-button" onClick={() => setSaved(true)}>{saved ? "Saved locally" : "Save today's entry"}</button>
  </main>;
}