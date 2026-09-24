"use client";

import { FormEvent, useState } from "react";

export default function InboxPage() {
  const [value, setValue] = useState("");
  const [items, setItems] = useState([
    { id: 1, text: "Research the psychology behind impulse purchases." },
    { id: 2, text: "Save the article about behavioral economics." }
  ]);

  function capture(event: FormEvent) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    setItems((current) => [{ id: Date.now(), text }, ...current]);
    setValue("");
  }

  return <main className="module-page">
    <header className="module-header"><div><p className="eyebrow">Capture</p><h1>Inbox</h1><p>Put useful thoughts here first. Organize them when you have context.</p></div><span className="module-count">{items.length} items</span></header>
    <form className="capture-form" onSubmit={capture}><textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Idea, question, URL, observation, task..." /><button type="submit" className="primary-button">Capture</button></form>
    <section className="list-stack">{items.map((item) => <article className="list-row" key={item.id}><div><span className="row-label">UNORGANIZED</span><p>{item.text}</p></div><button className="text-button" type="button">Organize</button></article>)}</section>
  </main>;
}