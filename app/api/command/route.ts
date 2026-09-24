import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function text(v: unknown) { return typeof v === "string" ? v.trim() : ""; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const command = text(body.command);
    if (!command) return NextResponse.json({ error: "Command is required." }, { status: 400 });

    const lower = command.toLowerCase();
    if (lower.startsWith("task:")) {
      const title = command.slice(5).trim();
      if (!title) return NextResponse.json({ error: "Task title is required." }, { status: 400 });
      const task = await db.task.create({ data: { title, date: new Date(), time: "09:00", duration: 30, status: "todo", priority: "medium" } });
      return NextResponse.json({ type: "created", kind: "task", item: task });
    }

    if (lower.startsWith("note:")) {
      const title = command.slice(5).trim();
      if (!title) return NextResponse.json({ error: "Note text is required." }, { status: 400 });
      const entry = await db.knowledgeEntry.create({ data: { title: title.slice(0, 80), type: "note", topic: "General", content: title, tags: "" } });
      return NextResponse.json({ type: "created", kind: "knowledge", item: entry });
    }

    if (lower.startsWith("research:")) {
      const question = command.slice(9).trim();
      if (!question) return NextResponse.json({ error: "Research question is required." }, { status: 400 });
      const item = await db.researchProject.create({ data: { title: question.slice(0, 100), question, status: "idea" } });
      return NextResponse.json({ type: "created", kind: "research", item });
    }

    const q = command.replace(/^(find|search|show)\s+/i, "").trim() || command;
    const [knowledge, research, content] = await Promise.all([
      db.knowledgeEntry.findMany({ where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }, { topic: { contains: q, mode: "insensitive" } }] }, take: 8 }),
      db.researchProject.findMany({ where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { question: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }] }, take: 8 }),
      db.contentItem.findMany({ where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }, { sourceIdea: { contains: q, mode: "insensitive" } }] }, take: 8 })
    ]);
    return NextResponse.json({ type: "search", query: q, results: [
      ...knowledge.map(x => ({ kind: "knowledge", id: x.id, title: x.title, preview: x.content.slice(0, 220) })),
      ...research.map(x => ({ kind: "research", id: x.id, title: x.title, preview: x.question.slice(0, 220) })),
      ...content.map(x => ({ kind: "content", id: x.id, title: x.title, preview: x.sourceIdea.slice(0, 220) }))
    ]});
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Command failed." }, { status: 400 });
  }
}
