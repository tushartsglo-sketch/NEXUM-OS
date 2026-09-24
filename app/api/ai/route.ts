import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildAIContext, buildSystemPrompt } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) return NextResponse.json({ error: "Question is required." }, { status: 400 });

    const [knowledge, tasks, projects, journal, inbox, research, library, contentItems] = await Promise.all([
      db.knowledgeEntry.findMany({ orderBy: { updatedAt: "desc" }, take: 40 }),
      db.task.findMany({ orderBy: { updatedAt: "desc" }, take: 30 }),
      db.project.findMany({ orderBy: { updatedAt: "desc" }, take: 20 }),
      db.journalEntry.findMany({ orderBy: { date: "desc" }, take: 30 }),
      db.inboxItem.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      db.researchProject.findMany({ include: { sources: true }, orderBy: { updatedAt: "desc" }, take: 40 }),
      db.libraryFile.findMany({ orderBy: { updatedAt: "desc" }, take: 40 }),
      db.contentItem.findMany({ orderBy: { updatedAt: "desc" }, take: 40 })
    ]);

    const context = buildAIContext([
      ...knowledge.map(x => ({ kind: "knowledge" as const, title: x.title, content: x.content + " | Topic: " + x.topic + " | Tags: " + x.tags })),
      ...tasks.map(x => ({ kind: "task" as const, title: x.title, content: x.status + " | " + x.priority + " | " + x.time + " | " + (x.project || "") })),
      ...projects.map(x => ({ kind: "project" as const, title: x.name, content: x.description + " | " + x.status + " | " + x.progress + "% complete" })),
      ...journal.map(x => ({ kind: "journal" as const, title: x.date.toISOString().slice(0,10), content: "Did: " + x.did + "\nLearned: " + x.learned + "\nMistakes: " + x.mistakes + "\nNext: " + x.next })),
      ...inbox.map(x => ({ kind: "inbox", title: x.createdAt.toISOString(), content: x.text })),
      ...research.map(x => ({ kind: "research", title: x.title, content: "Question: " + x.question + "\nStatus: " + x.status + "\nNotes: " + x.notes + "\nInsights: " + x.insights + "\nSources: " + x.sources.map(s => s.title + " " + s.url).join("; ") })),
      ...library.map(x => ({ kind: "library", title: x.name, content: x.type + " | " + x.description + " | Tags: " + x.tags + " | URL: " + x.url + "\nDocument text: " + x.documentText })),
      ...contentItems.map(x => ({ kind: "content", title: x.title, content: "Format: " + x.format + " | Stage: " + x.stage + " | Source idea: " + x.sourceIdea + "\n" + x.body }))
    ]);

    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ configured: false, answer: "NEXUM Intelligence is connected to your archive, but no AI provider key is configured yet." });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: JSON.stringify({ model: process.env.NEXUM_AI_MODEL || "gpt-5-mini", instructions: buildSystemPrompt(), input: "NEXUM CONTEXT:\n" + context + "\n\nUSER QUESTION:\n" + question })
    });
    if (!response.ok) return NextResponse.json({ error: "AI provider request failed." }, { status: 502 });
    const data = await response.json();
    return NextResponse.json({ configured: true, answer: data.output_text || "No answer returned." });
  } catch {
    return NextResponse.json({ error: "Unable to process the NEXUM AI request." }, { status: 500 });
  }
}